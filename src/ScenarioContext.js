export default class ScenarioContext {
  constructor(page, options) {
    this.page = page;
    this.options = options;
    this.scene = null;
    this.interceptionRules = { global: {}, scene: {} };
    this.pagesWithInterception = new WeakSet();
    this.keyValueContext = {
      store: {},
      get(key) {
        return this.store[key];
      },
      set(key, value) {
        this.store[key] = value;
      }
    };
  }

  get(key) {
    return this.keyValueContext.get(key);
  }

  set(key, value) {
    this.keyValueContext.set(key, value);
  }

  getPage() {
    return this.page;
  }

  async setPage(page) {
    this.page = page;
    await this.setRequestInterceptionOnce();
  }

  getScene() {
    return this.scene;
  }

  setScene(scene) {
    this.scene = scene;
  }

  async updateInterceptionRules({ global, scene }) {
    this.interceptionRules = {
      global: { ...this.interceptionRules.global, ...global },
      scene: scene ?? this.interceptionRules.scene
    };
    await this.setRequestInterceptionOnce();
  }

  async setRequestInterceptionOnce() {
    const { compareUrl } = this.options;
    const page = this.getPage();

    if (this.pagesWithInterception.has(page)) {
      return;
    }
    this.pagesWithInterception.add(page);

    await page.setRequestInterception(true);
    await page.on("request", request => {
      const {
        global: globalInterceptionRules,
        scene: sceneInterceptionRules
      } = this.interceptionRules;

      const interceptionRules = {
        ...globalInterceptionRules,
        ...sceneInterceptionRules
      };

      try {
        let isIntercepted = false;
        for (const [path, rule] of Object.entries(interceptionRules)) {
          if (compareUrl(request.url(), path)) {
            isIntercepted = true;
            request.respond(rule(this.keyValueContext));
            break;
          }
        }

        if (!isIntercepted) {
          request.continue();
        }
      } catch (error) {
        console.log(error);
      }
    });
  }
}
