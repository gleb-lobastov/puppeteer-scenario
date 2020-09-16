const READONLY_FIELDS = ['page', 'scene'];

export default class ScenarioContext {
  constructor(page) {
    this.page = page;
    this.scene = null;
    this.keyValueContext = {
      store: {},
      get(key) {
        return this.store[key];
      },
      set(key, value) {
        this.store[key] = value;
      },
    };
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
  }

  getScene() {
    return this.scene;
  }

  setScene(scene) {
    this.scene = scene;
  }
}
