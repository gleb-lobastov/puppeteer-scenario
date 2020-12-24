export default class RequestMock {
  constructor(options) {
    this.options = options ?? {};
  }

  url = jest.fn(() => {
    return this.options.url;
  });

  method = jest.fn(() => {
    return this.options.method;
  });

  respond = jest.fn();

  continue = jest.fn();
}
