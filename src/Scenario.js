import Context from "./Context";

export default class Scenario {
  constructor(page) {
    this.page = page;
    this.acts = [];
    this.actResult = null;
    this.actError = null;
    this.context = new Context();
    return this;
  }

  act(action, ...args) {
    this.acts.push({
      scene: this.curentScene,
      action,
      args
    });
    return this;
  }

  showScene(Scene, ...args) {
    this.expectScene(Scene);
    this.act("show", ...args);
    return this;
  }

  expectScene = Scene => {
    this.act(() => {
      this.currentScene = new Scene(this.page, this.context);
    });
    return this;
  };

  then(onResolve, onError) {
    this.act(() => {
      if (this.actError) {
        onError(this.actError);
      } else {
        onResolve(this.actResult);
      }
    });
    return this;
  }

  finally(callback) {
    this.act(() => callback());
    return this;
  }

  async play() {
    const callAction = (actionName, ...args) => {
      let errorMsg;
      if (!this.currentScene?.[actionName]) {
        const sceneName = getSceneName(this.currentScene);
        errorMsg = !this.currentScene
          ? `currentScene is no setup`
          : `${sceneName} doesn't have action ${actionName}`;
        return Promise.reject(new Error(errorMsg));
      }
      return this.currentScene[actionName](...args);
    };
    /* eslint-disable no-await-in-loop */
    for (let actIndex = 0; actIndex < this.acts.length; actIndex += 1) {
      const { action, args } = this.acts[actIndex];

      const promise =
        typeof action === "function"
          ? action(this.currentScene, ...args)
          : callAction(action, ...args);

      try {
        this.actResult = await promise;
        this.actError = null;
      } catch (error) {
        this.actResult = null;
        this.actError = error;
      }
    }
    /* eslint-enable no-await-in-loop */
  }
}

function getSceneName(scene) {
  return scene?.constructor?.name || "current scene";
}
