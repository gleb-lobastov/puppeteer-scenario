import ScenarioContext from "./ScenarioContext";

export default class Scenario {
  constructor(name) {
    this.name = name;
    this.steps = [];
    this.assertionsCount = 0;
    this.stepIndex = 0;
    return this;
  }

  log(message) {
    if (process.env.DEBUG_PUPPETEER_SCENARIO) {
      console.log(`Scenario "${this.name}":`, message);
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

  arrange({ scene: Scene, page, url, ...sceneProperties }) {
    this.step(async context => {
      if (page) {
        this.log("arrange page");
        await context.setPage(page);
      }
      const currentPage = page || context.getPage();
      if (url) {
        this.log("arrange url", url, Boolean(currentPage));
        await currentPage.goto(url, { waitUntil: "networkidle2" });
      }
      if (Scene) {
        const scene = new Scene(currentPage);
        this.log(`arrange scene "${getSceneName(scene)}"`);
        context.setScene(scene);
        if (scene.arrange) {
          await scene.arrange(sceneProperties);
        }
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
    expect.assertions(this.assertionsCount);

    const context = new ScenarioContext();
    context.setPage(page);

    /* eslint-disable no-await-in-loop */
    for (; this.stepIndex < this.steps.length; this.stepIndex += 1) {
      const step = this.steps[this.stepIndex];

      try {
        await step(context);
      } catch (error) {
        context.set("error", error);
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

function getSceneName(scene) {
  return scene?.constructor?.name || (scene ? "unknown scene" : "no scene");
}
