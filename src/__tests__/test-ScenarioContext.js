import "regenerator-runtime";
import ScenarioContext from "../ScenarioContext";
import InterceptorMock from "./mocks/InterceptorMock";

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
});

describe("ScenarioContext interceptor", () => {
  it("should forward scene interceptors in setPage method", () => {
    const pageObj = { page: true };
    const globalInterceptionRules = { globalInterceptionRules: true };
    const sceneInterceptionRules = { sceneInterceptionRules: true };
    const context = new ScenarioContext(pageObj);
    context.interceptor = new InterceptorMock();

    context.updateInterceptionRules({
      global: globalInterceptionRules,
      scene: sceneInterceptionRules
    });

    expect(context.interceptor.updateInterceptionRules).toBeCalledWith(
      pageObj,
      {
        global: globalInterceptionRules,
        scene: sceneInterceptionRules
      }
    );
  });

  it("should reset scene interceptors in setPage method", () => {
    const initialPageObj = {};
    const updatedPageObj = {};
    const context = new ScenarioContext(initialPageObj);
    context.interceptor = new InterceptorMock();

    context.setPage(updatedPageObj);

    expect(context.interceptor.updatePage).toBeCalledTimes(1);
  });
});
