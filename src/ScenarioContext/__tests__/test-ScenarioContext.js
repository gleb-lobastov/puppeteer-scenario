import ScenarioContext from "../ScenarioContext";

describe("ScenarioContext page", () => {
  it("should return initial page in getPage method if other page is not set", () => {
    const pageObj = {};
    const context = new ScenarioContext(pageObj);
    expect(context.getPage()).toBe(pageObj);
  });

  it("should return page in getPage method that set in setPage method", () => {
    const initialPageObj = {};
    const updatedPageObj = {};
    const context = new ScenarioContext(initialPageObj);

    context.setPage(updatedPageObj);

    expect(context.getPage()).toBe(updatedPageObj);
  });
});

describe("ScenarioContext scene", () => {
  it("should return null in getScene method if scene is not set", () => {
    const context = new ScenarioContext({});
    expect(context.getScene()).toBeNull();
  });

  it("should return scene in getScene method that set in setScene method", () => {
    const sceneObj = {};
    const context = new ScenarioContext({});

    context.setScene(sceneObj);

    expect(context.getScene()).toBe(sceneObj);
  });

  it("should reset scene in setPage method", () => {
    const initialPageObj = {};
    const updatedPageObj = {};
    const sceneObj = {};
    const context = new ScenarioContext(initialPageObj);

    context.setScene(sceneObj);
    context.setPage(updatedPageObj);

    expect(context.getScene()).toBeNull();
  });
});

describe("ScenarioContext keyValueContext", () => {
  it("should return undefined in get method if value by key is not set", () => {
    const context = new ScenarioContext({});
    expect(context.get("anykey")).toBeUndefined();
  });

  it("should return value in get method that set in set method", () => {
    const key = "anykey";
    const value = "whatever";
    const context = new ScenarioContext({});

    context.set(key, value);

    expect(context.get(key)).toBe(value);
  });

  it("should return part of nested value in get method that set in set method", () => {
    const keyPart = "long.path,for";
    const lastKeyPart = "anykey";
    const value = "whatever";
    const context = new ScenarioContext({});

    context.set(`${keyPart}.${lastKeyPart}`, value);

    expect(context.get(keyPart)).toEqual({ [lastKeyPart]: value });
  });
});
