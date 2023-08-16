import { describe, expect, it, vi } from "vitest";

import { createDataManager } from "../src/data-manager";

describe("data manager", () => {
  it("can be created", () => {
    const dataManager = createDataManager({ data: "test" });

    expect(dataManager).toMatchInlineSnapshot(`
      {
        "getData": [Function],
        "setData": [Function],
        "subscribe": [Function],
      }
    `);
  });

  it("retrieves the data", () => {
    const dataManager = createDataManager({ data: "test" });

    expect(dataManager.getData()).toMatchInlineSnapshot(`
      {
        "data": "test",
      }
    `);
  });

  it("can mutate the data", () => {
    const dataManager = createDataManager({ age: 17 });

    dataManager.setData((oldData) => ({
      age: oldData.age + 1,
    }));

    expect(dataManager.getData()).toMatchInlineSnapshot(`
      {
        "age": 18,
      }
    `);
  });

  it("allows subscribing to data changes", () => {
    const dataManager = createDataManager({ age: 17 });

    const listener = vi.fn();

    dataManager.subscribe(listener);

    dataManager.setData((oldData) => ({
      age: oldData.age + 1,
    }));

    expect(listener).toHaveBeenCalledWith({ age: 18 });
  });

  it("allows unsubscribing from data changes", () => {
    const dataManager = createDataManager({ age: 17 });

    const listener = vi.fn();

    const unsubscribe = dataManager.subscribe(listener);

    unsubscribe();

    dataManager.setData((oldData) => ({
      age: oldData.age + 1,
    }));

    expect(listener).not.toHaveBeenCalled();
  });
});
