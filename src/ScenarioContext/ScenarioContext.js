import Interceptor from "../Interceptor/Interceptor";
import createKeyValueContext from "./createKeyValueContext";

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
  }

  getScene() {
    return this.scene;
  }

  setScene(scene) {
    this.scene = scene;
  }
}
