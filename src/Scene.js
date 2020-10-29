import * as actions from "./utils/actions";

export default class Scene {
  constructor(page, context) {
    this.page = page;
    this.context = context;
  }

  batchType(batchValues, options) {
    return actions.batchType(this.page, batchValues, options);
  }

  type(selector, value, options) {
    return actions.type(this.page, selector, value, options);
  }

  click(selector, options) {
    return actions.click(this.page, selector, options);
  }
}
