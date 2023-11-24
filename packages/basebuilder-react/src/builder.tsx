import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type LazyExoticComponent,
} from "react";
import {
  builderStoreEventsNames,
  createBuilder,
  createBuilderStore,
  type Builder as BaseBuilder,
  type BuilderStore,
  type BuilderStoreData,
  type BuilderStoreEvent,
} from "basebuilder";

import {
  type EntitiesComponents,
  type EntityForRender,
  type GenericEntityComponent,
} from "./entities";
import { type EventsListeners } from "./utils";

export function useBuilderStore<TBuilder extends BaseBuilder>(
  builder: TBuilder,
  options: {
    initialData?: Partial<BuilderStoreData<TBuilder>>;
    events?: EventsListeners<BuilderStoreEvent<TBuilder>>;
  } = {},
): BuilderStore<TBuilder> {
  const builderStoreRef = useMemo(
    () =>
      createBuilderStore(builder, {
        initialData: {
          schema: options.initialData?.schema,
          entitiesAttributesErrors:
            options.initialData?.entitiesAttributesErrors,
        },
      }),
    [
      builder,
      options.initialData?.entitiesAttributesErrors,
      options.initialData?.schema,
    ],
  );

  useEffect(() => {
    return builderStoreRef.subscribe((_data, events) => {
      events.forEach((event) => {
        const listener = options.events?.[`on${event.name}`] as
          | undefined
          | ((payload: BuilderStoreEvent<TBuilder>["payload"]) => void);

        listener?.(event.payload);
      });
    });
  }, [builderStoreRef, options.events]);

  return builderStoreRef;
}

export function useBuilderStoreData<TBuilder extends BaseBuilder>(
  builderStore: BuilderStore<TBuilder>,
  shouldUpdate: (events: Array<BuilderStoreEvent<TBuilder>>) => boolean = () =>
    true,
): BuilderStoreData<TBuilder> {
  const dataCache = useRef(builderStore.getData());

  return useSyncExternalStore(
    (listen) =>
      builderStore.subscribe((data, events) => {
        if (shouldUpdate(events)) {
          dataCache.current = data;

          listen();
        }
      }),
    () => dataCache.current,
    () => dataCache.current,
  );
}

const BuilderEntitiesContext = createContext<{
  components: EntitiesComponents;
  renderEntity: GenericEntityComponent;
  builderStore: BuilderStore;
}>({
  builderStore: createBuilderStore(createBuilder({ entities: [] })),
  components: {},
  renderEntity: ({ children }) => children,
});

const Entity = memo(function Entity(props: {
  entityId: string;
}): JSX.Element | null {
  const { components, renderEntity, builderStore } = useContext(
    BuilderEntitiesContext,
  );

  const data = useBuilderStoreData(builderStore, (events) =>
    events.some(
      (event) =>
        (event.name === builderStoreEventsNames.EntityUpdated &&
          event.payload.entity.id === props.entityId) ||
        event.name === builderStoreEventsNames.DataSet,
    ),
  );

  const entity = data.schema.entities[props.entityId];

  if (!entity) {
    throw new Error(
      `[Entity] The entity with ID "${props.entityId}" was not found.`,
    );
  }

  const childrenIds = entity?.children ?? [];

  const EntityComponent = components[entity.type];

  if (!EntityComponent) {
    throw new Error(
      `[Entity] No entity component found for the entity of type "${entity.type}".`,
    );
  }

  const entityForRender: EntityForRender = {
    ...entity,
    id: props.entityId,
  };

  return renderEntity({
    entity: entityForRender,
    children: (
      <EntityComponent
        entity={entityForRender}
        setValue={() => {
          return;
        }}
        resetError={() => {
          return;
        }}
        resetValue={() => {
          return;
        }}
        clearValue={() => {
          return;
        }}
        validate={() => {
          return new Promise((resolve) => resolve());
        }}
      >
        {childrenIds.map((entityId) => (
          <Entity key={entityId} entityId={entityId} />
        ))}
      </EntityComponent>
    ),
  });
});

Entity.displayName = "Entity";

function Entities<TBuilder extends BaseBuilder>(props: {
  builderStore: BuilderStore<TBuilder>;
  components: EntitiesComponents<TBuilder>;
  children?: GenericEntityComponent<TBuilder>;
}): JSX.Element {
  const data = useBuilderStoreData(props.builderStore, (events) =>
    events.some(
      (event) =>
        event.name === builderStoreEventsNames.RootUpdated ||
        event.name === builderStoreEventsNames.DataSet,
    ),
  );

  const renderEntity =
    (props.children as GenericEntityComponent) ?? ((props) => props.children);

  return (
    <BuilderEntitiesContext.Provider
      value={{
        renderEntity,
        builderStore: props.builderStore,
        components: props.components as unknown as EntitiesComponents,
      }}
    >
      {data.schema.root.map((entityId) => (
        <Entity key={entityId} entityId={entityId} />
      ))}
    </BuilderEntitiesContext.Provider>
  );
}

export const BuilderAttributesContext = createContext<{
  builderStore: BuilderStore;
  entityId: string;
}>({
  builderStore: createBuilderStore(createBuilder({ entities: [] })),
  entityId: "",
});

function Attributes<TBuilder extends BaseBuilder>(props: {
  builderStore: BuilderStore<TBuilder>;
  entityId: string;
  components: {
    [K in TBuilder["entities"][number]["name"]]:
      | (() => JSX.Element | null)
      | LazyExoticComponent<() => JSX.Element | null>;
  };
}): JSX.Element {
  const data = useBuilderStoreData(props.builderStore, (events) =>
    events.some(
      (event) =>
        event.name === builderStoreEventsNames.EntityAdded ||
        event.name === builderStoreEventsNames.EntityCloned ||
        event.name === builderStoreEventsNames.EntityDeleted ||
        event.name === builderStoreEventsNames.DataSet,
    ),
  );

  const entity = data.schema.entities[props.entityId];

  if (!entity) {
    throw new Error(
      `[Attributes] The entity with ID "${props.entityId}" was not found.`,
    );
  }

  return (
    <BuilderAttributesContext.Provider
      value={{
        builderStore: props.builderStore,
        entityId: props.entityId,
      }}
    >
      {props.components[entity.type]({})}
    </BuilderAttributesContext.Provider>
  );
}

export const Builder = {
  Entities,
  Attributes,
};
