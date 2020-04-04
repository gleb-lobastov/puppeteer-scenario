export default class Context {
  constructor() {
    const context = {};
    this.set = (key, value) => {
      context[key] = value;
    };
    this.get = key => context[key];
    this.delete = key => {
      delete context[key];
    };
  }
}
