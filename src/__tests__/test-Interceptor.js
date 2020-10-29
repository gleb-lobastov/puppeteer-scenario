import Interceptor from "../Interceptor";
import PageMock from "./mocks/PageMock";
import RequestMock from "./mocks/RequestMock";

describe("Interceptor", () => {
  it("should intercept request", async () => {
    const pageMock = new PageMock();
    const requestMock = new RequestMock({ url: "/test/1/" });
    const response = "response";
    const interceptor = new Interceptor();

    await interceptor.updateInterceptionRules(pageMock, {
      global: { "test/\\d": jest.fn(() => response) }
    });
    await pageMock.fireEvent("request", requestMock);

    expect(pageMock.setRequestInterception).toBeCalledTimes(1);
    expect(requestMock.respond).toBeCalledWith(response);
  });

  it("should prefer request from scene interceptionRules", async () => {
    const pageMock = new PageMock();
    const requestMock = new RequestMock({ url: "/test/" });
    const response = "response";
    const interceptor = new Interceptor();

    await interceptor.updateInterceptionRules(pageMock, {
      global: { test: jest.fn(() => "not this") },
      scene: { test: jest.fn(() => response) }
    });
    await pageMock.fireEvent("request", requestMock);

    expect(requestMock.respond).toBeCalledWith(response);
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
      scene: { "world/hello": jest.fn(() => response) }
    });
    await pageMock.fireEvent("request", requestMock);

    expect(requestMock.respond).toBeCalledWith(response);
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
