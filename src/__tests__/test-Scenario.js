import Scenario from "../Scenario";
import SceneMock from "./mocks/SceneMock";
import PageMock from "./mocks/PageMock";
import InterceptorMock from "./mocks/InterceptorMock";

beforeEach(() => {
  global.page = new PageMock();
});

describe("Scenario arrange", () => {
  it("should arrange Scene", async () => {
    const { contextPromise, scenario } = createScenario("arrange Scene");

    await scenario.arrange({ scene: SceneMock }).play();

    expect((await contextPromise).getScene().arrange).toBeCalledTimes(1);
    expect((await contextPromise).getScene()).toBeInstanceOf(SceneMock);
  });

  it("should arrange Scene with intercept", async () => {
    const { contextPromise, scenario } = createScenario(
      "arrange Scene with intercept"
    );
    const page = new PageMock();
    const sceneInterceptionRules = { test: () => ({}) };

    await scenario
      .step(context => {
        // eslint-disable-next-line no-param-reassign
        context.interceptor = new InterceptorMock();
      })
      .arrange({
        scene: SceneMock.preset({ intercept: sceneInterceptionRules })
      })
      .play({ page });

    expect(
      (await contextPromise).interceptor.updateInterceptionRules
    ).toBeCalledWith(page, { scene: sceneInterceptionRules });
  });

  it("should arrange contextValues", async () => {
    const { contextPromise, scenario } = createScenario(
      "arrange contextValues"
    );

    await scenario
      .arrange({ context: { keyA: "valueA", keyB: "valueB" } })
      .play();

    expect((await contextPromise).keyValueContext.get("keyA")).toBe("valueA");
    expect((await contextPromise).keyValueContext.get("keyB")).toBe("valueB");
  });

  it("should arrange page", async () => {
    const { contextPromise, scenario } = createScenario("arrange page");
    const page = new PageMock();

    await scenario.arrange({ page }).play();

    expect((await contextPromise).getPage()).toBe(page);
  });

  it("should arrange url", async () => {
    const { contextPromise, scenario } = createScenario("arrange url");
    const url = "/123";

    await scenario.arrange({ url }).play();

    expect((await contextPromise).getPage().goto).toBeCalledWith(
      url,
      expect.anything()
    );
  });
});

describe("Scenario act", () => {
  it("should act", async () => {
    const action = jest.fn();
    const args = [{ keyA: "valueA", keyB: "valueB" }, "arg2"];
    await new Scenario({ name: "act" })
      .arrange({ scene: SceneMock.preset({ action }) })
      .act("action", ...args)
      .play();

    expect(action).toBeCalledWith(...args);
  });
});

describe("Scenario assert", () => {
  it("should assert", async () => {
    const assertion = jest.fn();
    await new Scenario({ name: "assert" })
      .assert(assertion, { assertionsCount: 0 })
      .play();

    expect(assertion).toBeCalledTimes(1);
  });

  it("should count assertions", async () => {
    await new Scenario({ name: "count assertions" })
      .assert(
        () => {
          expect(true).toBe(true);
        },
        { assertionsCount: 1 }
      )
      .assert(
        () => {
          expect(true).toBe(true);
          expect(true).toBe(true);
          expect(true).toBe(true);
        },
        { assertionsCount: 3 }
      )
      .play();
  });
});

describe("Scenario include", () => {
  it("should include", async () => {
    const step = jest.fn();
    const scenarioToInclude = new Scenario({ name: "scenarioToInclude" }).step(
      step
    );

    await new Scenario({ name: "include" }).include(scenarioToInclude).play();

    expect(step).toBeCalledTimes(1);
  });

  it("should include multiple times", async () => {
    const step = jest.fn();
    const scenarioToInclude = new Scenario({
      name: "scenarioToInclude"
    }).step(step);

    await new Scenario({ name: "include multiple times" })
      .include(scenarioToInclude)
      .include(scenarioToInclude)
      .include(scenarioToInclude)
      .play();

    expect(step).toBeCalledTimes(3);
  });

  it("should include even played scenario", async () => {
    const step = jest.fn();
    const scenarioToInclude = new Scenario({
      name: "scenarioToInclude"
    }).step(step);

    await scenarioToInclude.play();
    await new Scenario({ name: "include even played scenario" })
      .include(scenarioToInclude)
      .play();

    expect(step).toBeCalledTimes(2);
  });

  it("should count included assertions", async () => {
    const scenarioToInclude = new Scenario({
      name: "scenarioToInclude"
    }).assert(
      () => {
        /* call later */
      },
      { assertionsCount: 2 }
    );

    await new Scenario({ name: "count included assertions" })
      .include(scenarioToInclude)
      .assert(() => {
        /* call later */
      })
      .play();

    expect(true).toBe(true);
    expect(true).toBe(true);
    expect(true).toBe(true);
  });
});

function createScenario(name) {
  let resolveContextPromise;
  const contextPromise = new Promise(resolve => {
    resolveContextPromise = resolve;
  });
  const scenario = new Scenario({ name }).step(context => {
    resolveContextPromise(context);
  });
  return { contextPromise, scenario };
}
