export default class Interceptor {
  constructor(options = {}) {
    this.options = options;
    this.interceptionRules = { global: {}, scene: {} };
    this.pagesWithInterception = new WeakSet();
  }

  async updateInterceptionRules(page, { global, scene }) {
    this.interceptionRules = {
      global: { ...this.interceptionRules.global, ...global },
      scene: scene ?? this.interceptionRules.scene
    };
    await this.setRequestInterceptionOnce(page);
  }

  async updatePage(page) {
    this.interceptionRules = {
      global: this.interceptionRules.global
    };
    await this.setRequestInterceptionOnce(page);
  }

  async setRequestInterceptionOnce(page) {
    const { compareUrl = defaultCompareUrl } = this.options;

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
            const response = rule(request, this.keyValueContext);
            if (response !== null && response !== undefined) {
              isIntercepted = true;
              request.respond(response);
            }
            break;
          }
        }

        if (!isIntercepted) {
          request.continue();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
      }
    });
  }
}

function defaultCompareUrl(requestUrl, referenceUrl) {
  return new RegExp(referenceUrl).test(requestUrl);
}
