import Interceptor from "./Interceptor";

export default class ScenarioContext {
  constructor(page, { interceptorOptions, ...options } = {}) {
    this.page = page;
    this.options = options;
    this.scene = null;
    this.interceptor = new Interceptor(interceptorOptions);
    this.keyValueContext = createKeyValueContext();
  }

  get(key) {
    return this.keyValueContext.get(key);
  }

  set(key, value) {
    this.keyValueContext.set(key, value);
  }

  getPage() {
    return this.page;
  }

  setPage(page) {
    this.page = page;
    this.setScene(null);
    return this.interceptor.updatePage(page);
  }

  getScene() {
    return this.scene;
  }

  setScene(scene) {
    this.scene = scene;
  }

  updateInterceptionRules(interceptionRules) {
    return this.interceptor.updateInterceptionRules(
      this.getPage(),
      interceptionRules
    );
  }
}

function createKeyValueContext() {
  const store = {};
  return {
    get(path) {
      const parts = path.split(".");
      return parts.reduce(
        (storePart, pathPart) => storePart?.[pathPart],
        store
      );
    },
    set(path, value) {
      const parts = path.split(".");
      const key = parts.pop();

      let storePart = store;
      parts.forEach(part => {
        if (storePart[part] === undefined) {
          storePart[part] = {};
        }
        storePart = storePart[part];
      });
      storePart[key] = value;
    }
  };
}
