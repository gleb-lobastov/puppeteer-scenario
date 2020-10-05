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

  fireEvent(eventName, ...args) {
    const callbacks = this.callbacks[eventName] || [];
    return Promise.all(callbacks.map(callback => callback(...args)));
  }
}
