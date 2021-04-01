import createKeyValueContext from "./createKeyValueContext";
import Interceptor from "../Interceptor";

export default class ScenarioContext {
  constructor(page, { interceptorOptions, ...options } = {}) {
    this.page = page;
    this.options = options;
    this.interceptor = new Interceptor(interceptorOptions);
    this.interceptor.setContext(this);
    this.scene = null;
    this.keyValueContext = createKeyValueContext();
  }

  get(key) {
    return this.keyValueContext.get(key);
  }

  wait(key, timeout) {
    return this.keyValueContext.wait(key, timeout);
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
