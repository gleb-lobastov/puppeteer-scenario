import createKeyValueContext from "../createKeyValueContext";

let kvCtx;
beforeEach(() => {
  kvCtx = createKeyValueContext();
});

describe("createKeyValueContext", () => {
  it("should set and get", () => {
    expect(kvCtx.get("whatever")).toBeUndefined();
    kvCtx.set("whatever", 1);
    expect(kvCtx.get("whatever")).toBe(1);
  });

  it("should wait", async () => {
    const promise = kvCtx.wait("whatever");
    kvCtx.set("whatever", 1);
    expect(await promise).toBe(1);
  });
});
