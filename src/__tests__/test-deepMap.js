import asyncDeepMap from "../utils/asyncDeepMap";

describe("asyncDeepMap", () => {
  it("should process primitive value", async () => {
    expect.assertions(1);
    const primitive = "whatever";
    expect(await asyncDeepMap(primitive, syncCallback)).toBe(
      await asyncCallback(primitive)
    );
  });

  it("should be ok with sync callback ", async () => {
    expect.assertions(1);
    const primitive = "whatever";
    expect(await asyncDeepMap(primitive, syncCallback)).toBe(
      syncCallback(primitive)
    );
  });

  it("should map over an object", async () => {
    expect.assertions(1);
    const iteratee = { a: 1, b: 2, c: 3 };
    expect(await asyncDeepMap(iteratee, asyncCallback)).toEqual({
      a: await asyncCallback(iteratee.a),
      b: await asyncCallback(iteratee.b),
      c: await asyncCallback(iteratee.c)
    });
  });

  it("should map over an array", async () => {
    expect.assertions(1);
    const iteratee = ["a", "b", "c"];
    expect(await asyncDeepMap(iteratee, asyncCallback)).toEqual(
      await Promise.all(iteratee.map(asyncCallback))
    );
  });

  it("should map over a nested objects and arrays", async () => {
    expect.assertions(1);
    const iteratee = {
      x: { a: 1, b: 2, c: ["foo", "bar"] },
      y: { z: [{ secret: 123 }] }
    };
    expect(await asyncDeepMap(iteratee, asyncCallback)).toEqual({
      x: {
        a: await asyncCallback(iteratee.x.a),
        b: await asyncCallback(iteratee.x.b),
        c: await Promise.all(iteratee.x.c.map(asyncCallback))
      },
      y: { z: [{ secret: await asyncCallback(iteratee.y.z[0].secret) }] }
    });
  });
});

function syncCallback(x) {
  return `${x}!`;
}

function asyncCallback(x) {
  return Promise.resolve(`${x}!`);
}
