import objMapAsync from "./objMapAsync";

export default async function asyncDeepMap(maybeIteratee, callback) {
  if (Array.isArray(maybeIteratee)) {
    return Promise.all(maybeIteratee.map(item => asyncDeepMap(item, callback)));
  }
  if (isPlainObject(maybeIteratee)) {
    return objMapAsync(maybeIteratee, value => asyncDeepMap(value, callback));
  }
  return callback(maybeIteratee);
}

function isPlainObject(maybePlainObject) {
  if (typeof maybePlainObject === "object" && maybePlainObject !== null) {
    const prototype = Object.getPrototypeOf(maybePlainObject);
    return prototype === Object.prototype || prototype === null;
  }
  return false;
}
