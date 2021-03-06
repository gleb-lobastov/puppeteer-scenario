export default function createKeyValueContext() {
    const store = {};
    return {
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
        }
    };
}
