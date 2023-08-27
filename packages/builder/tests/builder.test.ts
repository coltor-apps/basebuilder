import { afterEach, describe, expect, it, vi } from "vitest";

import { createBuilder, createEntity } from "../src";
import * as uuidExports from "../src/uuid";

describe("builder", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("can be created with minimal options", () => {
    const generateUuidMock = vi.spyOn(uuidExports, "generateUuid");

    const validateUuidMock = vi.spyOn(uuidExports, "validateUuid");

    const builder = createBuilder({
      entities: [],
    });

    expect(builder).toMatchInlineSnapshot(`
      {
        "childrenAllowed": {},
        "entities": [],
        "entityId": {
          "generate": [MockFunction generateUuid],
          "validate": [MockFunction validateUuid],
        },
        "parentRequired": [],
      }
    `);

    builder.entityId.generate();

    builder.entityId.validate("6e0035c3-0d4c-445f-a42b-2d971225447c");

    expect(generateUuidMock).toHaveBeenCalled();

    expect(validateUuidMock).toHaveBeenCalled();
  });

  it("can be created with entity ID generator and validator", () => {
    const builder = createBuilder({
      entities: [],
      entityId: {
        generate() {
          return "1";
        },
        validate(id) {
          if (id !== "1") {
            throw new Error("Not equal to 1");
          }
        },
      },
    });

    expect(builder).toMatchInlineSnapshot(`
      {
        "childrenAllowed": {},
        "entities": [],
        "entityId": {
          "generate": [Function],
          "validate": [Function],
        },
        "parentRequired": [],
      }
    `);

    expect(builder.entityId.generate()).toMatchInlineSnapshot('"1"');

    expect(builder.entityId.validate("1")).toMatchInlineSnapshot("undefined");

    expect(() =>
      builder.entityId.validate("2"),
    ).toThrowErrorMatchingInlineSnapshot('"Not equal to 1"');
  });

  it("can be created with entities", () => {
    const builder = createBuilder({
      entities: [createEntity({ name: "test" })],
    });

    expect(builder).toMatchInlineSnapshot(`
      {
        "childrenAllowed": {},
        "entities": [
          {
            "defaultValue": [Function],
            "inputs": [],
            "isValueAllowed": false,
            "name": "test",
            "shouldBeProcessed": [Function],
            "validate": [Function],
          },
        ],
        "entityId": {
          "generate": [Function],
          "validate": [Function],
        },
        "parentRequired": [],
      }
    `);
  });

  it("can be created with children and parent rules", () => {
    const builder = createBuilder({
      entities: [createEntity({ name: "test" })],
      childrenAllowed: {
        test: true,
      },
      parentRequired: ["test"],
    });

    expect(builder).toMatchInlineSnapshot(`
      {
        "childrenAllowed": {
          "test": true,
        },
        "entities": [
          {
            "defaultValue": [Function],
            "inputs": [],
            "isValueAllowed": false,
            "name": "test",
            "shouldBeProcessed": [Function],
            "validate": [Function],
          },
        ],
        "entityId": {
          "generate": [Function],
          "validate": [Function],
        },
        "parentRequired": [
          "test",
        ],
      }
    `);
  });
});
