import Interceptor from "../Interceptor";
import PageMock from "../../__tests__/mocks/PageMock";
import RequestMock from "../../__tests__/mocks/RequestMock";

describe("Interceptor", () => {
  it("should intercept request", async () => {
    const pageMock = new PageMock();
    const requestMock = new RequestMock({ url: "/test/1/" });
    const response = "response";
    const interceptor = new Interceptor();

    await interceptor.updateInterceptionRules(pageMock, {
      global: [{ url: "test/\\d", response: jest.fn(() => response) }]
    });
    await pageMock.fireEvent("request", requestMock);

    expect(pageMock.setRequestInterception).toBeCalledTimes(1);
    expect(requestMock.respond).toBeCalledWith({ body: response });
  });

  it("should prefer request from scene interceptionRules", async () => {
    const pageMock = new PageMock();
    const requestMock = new RequestMock({ url: "/test/" });
    const response = "response";
    const interceptor = new Interceptor();

    await interceptor.updateInterceptionRules(pageMock, {
      global: [{ url: "test", response: jest.fn(() => "not this") }],
      scene: [{ url: "test", response: jest.fn(() => response) }]
    });
    await pageMock.fireEvent("request", requestMock);

    expect(requestMock.respond).toBeCalledWith({ body: response });
  });

  it("should use custom compareUrl fn", async () => {
    const pageMock = new PageMock();
    const requestMock = new RequestMock({ url: "hello/world" });
    const response = "response";
    const compareReverse = (requestUrl, referenceUrl) => {
      const reverseUrl = requestUrl
        .split("/")
        .reverse()
        .join("/");
      return reverseUrl === referenceUrl;
    };
    const interceptor = new Interceptor({ compareUrl: compareReverse });

    await interceptor.updateInterceptionRules(pageMock, {
      scene: [{ url: "world/hello", response: jest.fn(() => response) }]
    });
    await pageMock.fireEvent("request", requestMock);

    expect(requestMock.respond).toBeCalledWith({ body: response });
  });

  it("should continue request if url not match", async () => {
    const pageMock = new PageMock();
    const requestMock = new RequestMock({ url: "whatever" });
    const interceptor = new Interceptor();

    await interceptor.updateInterceptionRules(pageMock, {});
    await pageMock.fireEvent("request", requestMock);

    expect(requestMock.respond).toBeCalledTimes(0);
    expect(requestMock.continue).toBeCalledTimes(1);
  });
});
