export default class PageMock {
  constructor() {
    this.callbacks = {};
  }

  on = jest.fn((eventName, callback) => {
    this.callbacks[eventName] = this.callbacks[eventName] || [];
    this.callbacks[eventName].push(callback);
  });

  setRequestInterception = jest.fn();

  goto = jest.fn();

  removeListener = jest.fn();

  close = jest.fn();

  waitForSelector = jest.fn();

  evaluate = jest.fn((evalFn, ...args) => evalFn(...args));

  $eval = jest.fn((selector, evalFn = value => value) => evalFn(selector));

  $$eval = jest.fn((selector, evalFn = value => value) => evalFn([selector]));

  fireEvent(eventName, ...args) {
    const callbacks = this.callbacks[eventName] || [];
    return Promise.all(callbacks.map(callback => callback(...args)));
  }
}
