import takeScreenshotIfNeeded from "./utils/takeScreenshotIfNeeded";
import getSceneName from "./utils/getSceneName";
import invokeExpect from "./utils/invokeExpect";
import { debug } from "./utils/log";
import ScenarioContext from "./ScenarioContext";
import { withPostponedValues } from "./PostponedValue";

export default class Scenario {
  static preset({ arrange, ...presetOptions }) {
    return function PresetScenario(options) {
      const scenario = new Scenario({
        ...presetOptions,
        ...options
      });

      if (arrange) {
        scenario.include(
          arrange instanceof Scenario
            ? arrange
            : new Scenario({ name: "preset arrange" }).arrange(arrange)
        );
      }

      return scenario;
    };
  }

  constructor({
    name = "unnamed scenario",
    screenshot = { takeScreenshot: false },
    compareUrl,
    interceptionFilter,
    interceptedResponseDefaults
  } = {}) {
    this.name = name;
    this.steps = [];
    this.assertionsCount = 0;
    this.stepIndex = 0;
    this.screenshotOptions =
      screenshot === true
        ? { takeScreenshot: true }
        : { takeScreenshot: true, ...screenshot };

    this.interceptorOptions = {
      compareUrl,
      interceptionFilter,
      interceptedResponseDefaults
    };
    return this;
  }

  log(message, ...args) {
    debug(`[${this.name}]`, message, ...args);
  }

  step(action) {
    this.steps.push(action);
    return this;
  }

  include(scenario) {
    this.steps.push(...scenario.steps);
    this.assertionsCount += scenario.assertionsCount;
    return this;
  }

  arrange({
    scene: Scene,
    page,
    url,
    intercept: globalInterceptionRules,
    interceptOnce: globalInterceptionOnceRules,
    context: contextValuesToSet,
    ...sceneProperties
  }) {
    this.step(async context => {
      if (contextValuesToSet) {
        Object.entries(contextValuesToSet).forEach(([key, value]) =>
          context.set(key, value)
        );
      }

      if (page) {
        this.log("arrange page");
        await context.setPage(page);
        await context.interceptor.updatePage(page);
      }
      const currentPage = page || context.getPage();

      // interceptions should be applied after page, because they applied to currentPage and irrelevant for previous one
      // interceptions should be applied before url, because it could intercept following requests
      if (globalInterceptionRules || globalInterceptionOnceRules) {
        this.log(`setup global interceptions`);
        await context.interceptor.updateInterceptionRules(currentPage, {
          global: globalInterceptionRules,
          globalOnce: globalInterceptionOnceRules
        });
      }

      const scene = Scene
        ? new Scene(currentPage, context.keyValueContext)
        : null;

      if (scene) {
        context.setScene(scene);
      }

      // scene should setup interceptions before url, because it could intercept following requests
      if (scene?.intercept || scene?.interceptOnce) {
        this.log(`setup scene interceptions "${getSceneName(scene)}"`);
        const sceneInterceptionRules = scene.intercept;
        const sceneInterceptionOnceRules = scene.interceptOnce;
        await context.interceptor.updateInterceptionRules(currentPage, {
          scene: sceneInterceptionRules,
          sceneOnce: sceneInterceptionOnceRules
        });
      }

      if (url) {
        this.log("arrange url", url, Boolean(currentPage));
        await currentPage.goto(url, { waitUntil: "networkidle2" });
      }

      // scene should be arranged after url, because it could expect page to load during arrangement
      if (scene?.arrange) {
        this.log(`arrange scene "${getSceneName(scene)}"`);
        await scene.arrange(sceneProperties);
      }
    });
    return this;
  }

  act(action, ...args) {
    if (!action) {
      throw new Error("required action to be defined");
    }
    if (typeof action === "function") {
      this.log(
        "Function passed to act. It's possible, but this feature is experimental and undocumented"
      );
      this.step(context => {
        return action({
          page: context.getPage(),
          scene: context.getScene(),
          context: context.keyValueContext
        });
      });
      return this;
    }
    this.step(async context => {
      const scene = context.getScene();
      if (!scene) {
        throw new Error(`cannot perform action "${action}, scene is not setup`);
      }
      if (!scene[action]) {
        const sceneName = getSceneName(scene);
        throw new Error(
          `action "${action}" is missing in scene "${sceneName}"`
        );
      }
      this.log(`action "${action}" on scene "${getSceneName(scene)}"`);
      const sceneActArgs = await withPostponedValues(args, context);
      await scene[action](...sceneActArgs);
    });
    return this;
  }

  assert(
    evaluation,
    {
      params: evaluationParams = [],
      expect: expectationName = "toEqual",
      expectedValue: rawExpectedValue,
      assertionsCount = typeof evaluation === "function" ? null : 1
    } = {}
  ) {
    if (assertionsCount === null) {
      throw new Error(
        "assertionsCount option should be explicitly set, if expectations is checked manually"
      );
    }
    this.step(async context => {
      this.log(`assertion for scene "${getSceneName(context.getScene())}"`);

      if (typeof evaluation === "function") {
        return evaluation({
          page: context.getPage(),
          scene: context.getScene(),
          context: context.keyValueContext
        });
      }

      const actualValue = await evaluate(evaluation, context, evaluationParams);
      const expectedValue =
        rawExpectedValue !== undefined
          ? await withPostponedValues(rawExpectedValue, context)
          : rawExpectedValue;
      return invokeExpect(actualValue, expectationName, expectedValue);
    });
    this.assertionsCount += assertionsCount;
    return this;
  }

  async play({ page = global.page } = {}) {
    if (this.assertionsCount) {
      expect.assertions(this.assertionsCount);
    }

    const context = new ScenarioContext(page, {
      interceptorOptions: this.interceptorOptions
    });

    /* eslint-disable no-await-in-loop */
    for (; this.stepIndex < this.steps.length; this.stepIndex += 1) {
      const step = this.steps[this.stepIndex];

      try {
        await step(context);
      } catch (error) {
        context.set("error", error);
        await takeScreenshotIfNeeded(this, context, this.screenshotOptions);
        break;
      }
    }

    const lastError = context.get("error");
    if (lastError) {
      throw lastError;
    }

    return context.keyValueContext;
    /* eslint-enable no-await-in-loop */
  }
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}

async function evaluate(evaluationNameOrValue, context, evaluationParams = []) {
  if (typeof evaluationNameOrValue !== "string") {
    return withPostponedValues(evaluationNameOrValue, context);
  }

  const evaluationName = evaluationNameOrValue;
  const scene = context.getScene();
  if (!scene) {
    throw new Error(
      `cannot perform evaluation "${evaluationName}, scene is not setup`
    );
  }

  const evaluation = scene.evaluations?.[evaluationName];
  if (!evaluation) {
    const sceneName = getSceneName(scene);
    throw new Error(
      `evaluation "${evaluation}" is missing in scene "${sceneName}"`
    );
  }

  if (typeof evaluation === "function") {
    const sceneEvalArgs = await withPostponedValues(
      asArray(evaluationParams),
      context
    );
    return withPostponedValues(evaluation.apply(scene, sceneEvalArgs), context);
  }

  return withPostponedValues(evaluation, context);
}
