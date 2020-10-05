export default class RequestMock {
  constructor(options) {
    this.options = options ?? {};
  }

  url = jest.fn(() => {
    return this.options.url;
  });

  respond = jest.fn();

  continue = jest.fn();
}
