export default function createKeyValueContext() {
  const store = {};
  const waitList = {};
  return {
    wait(path, timeout = 1000) {
      const instantValue = this.get(path);
      if (instantValue !== undefined || !(timeout > 0)) {
        return Promise.resolve(instantValue);
      }
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(
          () =>
            reject(
              new Error(`Wait time for context path "${path}" was expired`)
            ),
          timeout
        );
        waitList[path] = waitList[path] || [];
        waitList[path].push(value => {
          clearTimeout(timeoutId);
          resolve(value);
        });
      });
    },
    get(path) {
      const parts = path.split(".");
      return parts.reduce(
        (storePart, pathPart) => storePart?.[pathPart],
        store
      );
    },
    set(path, value) {
      const parts = path.split(".");
      const key = parts.pop();

      let storePart = store;
      parts.forEach(part => {
        if (storePart[part] === undefined) {
          storePart[part] = {};
        }
        storePart = storePart[part];
      });
      storePart[key] = value;

      Object.keys(waitList).forEach(pathToCompare => {
        if (!path.includes(pathToCompare)) {
          return;
        }
        const pathValue = this.get(path);
        const resolvers = waitList[pathToCompare];
        waitList[pathToCompare] = [];
        resolvers.forEach(resolver => resolver(pathValue));
      });
    }
  };
}
