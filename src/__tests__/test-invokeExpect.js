import invokeExpect from "../utils/invokeExpect";

let usageInfo;
beforeEach(() => {
  usageInfo = [];
  invokeExpect.expectFn = new Proxy(() => {}, {
    get: (target, key) => {
      usageInfo.push(`get:${key}`);
      return invokeExpect.expectFn;``
    },
    apply: (target, thisArg, argumentsList) => {
      usageInfo.push(`apply:${argumentsList}`);
      return invokeExpect.expectFn;
    }
  });
});

describe("invokeExpect", () => {
  it("should invoke expect as expected", () => {
    invokeExpect(1, "toBe", 1);
    expect(usageInfo).toEqual(["apply:1", "get:toBe", "apply:1"]);
  });

  it("should allow to use not", () => {
    invokeExpect(1, "not.toBe", 2);
    expect(usageInfo).toEqual(["apply:1", "get:not", "get:toBe", "apply:2"]);
  });
});
