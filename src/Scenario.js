import takeScreenshotIfNeeded from "./utils/takeScreenshotIfNeeded";
import getSceneName from "./utils/getSceneName";
import ScenarioContext from "./ScenarioContext";

export default class Scenario {
  static preset(presetOptions) {
    return function PresetScenario(options) {
      return new Scenario({
        ...presetOptions,
        ...options
      });
    };
  }

  constructor({
    name = "unnamed scenario",
    screenshot = { takeScreenshot: false },
    compareUrl = Object.is
  } = {}) {
    this.name = name;
    this.steps = [];
    this.assertionsCount = 0;
    this.stepIndex = 0;
    this.screenshotOptions =
      screenshot === true
        ? { takeScreenshot: true }
        : { takeScreenshot: true, ...screenshot };
    this.contextOptions = { compareUrl };
    return this;
  }

  log(message, ...args) {
    if (process.env.DEBUG_PUPPETEER_SCENARIO) {
      console.log(`Scenario "${this.name}":`, message, ...args);
    }
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
      }
      const currentPage = page || context.getPage();

      // interceptions should be applied after page, because they applied to currentPage and irrelevant for previous one
      // interceptions should be applied before url, because it could intercept following requests
      if (globalInterceptionRules) {
        this.log(`setup global interceptions`);
        await context.updateInterceptionRules({
          global: globalInterceptionRules
        });
      }

      const scene = Scene
        ? new Scene(currentPage, context.keyValueContext)
        : null;

      if (scene) {
        context.setScene(scene);
      }

      // scene should setup interceptions before url, because it could intercept following requests
      if (scene?.intercept) {
        this.log(`setup scene interceptions "${getSceneName(scene)}"`);
        const sceneInterceptionRules = scene.intercept();
        await context.updateInterceptionRules({
          scene: sceneInterceptionRules
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
      await scene[action](context.keyValueContext, ...args);
    });
    return this;
  }

  assert(callback, { assertionsCount = 1 } = {}) {
    this.step(context => {
      this.log(`assertion for scene "${getSceneName(context.getScene())}"`);
      return callback({
        page: context.getPage(),
        scene: context.getScene(),
        context: context.keyValueContext
      });
    });
    this.assertionsCount += assertionsCount;
    return this;
  }

  async play({ page = global.page } = {}) {
    if (this.assertionsCount) {
      expect.assertions(this.assertionsCount);
    }

    const context = new ScenarioContext(page, this.contextOptions);

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
