import checkRule from "./Interceptor/checkRule";
import assembleResponse from "./Interceptor/assembleResponse";

export default class Interceptor {
  constructor(options = {}) {
    this.options = options;
    this.interceptionRules = { global: [], scene: [] };
    this.pagesWithInterception = new WeakSet();
  }

  async updateInterceptionRules(page, { global, scene }) {
    this.interceptionRules = {
      global: [...global, ...this.interceptionRules.global],
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
    const { compareUrl, interceptedResponseDefaults } = this.options;

    if (this.pagesWithInterception.has(page)) {
      return;
    }
    this.pagesWithInterception.add(page);

    await page.setRequestInterception(true);
    await page.on("request", async request => {
      const {
        global: globalInterceptionRules,
        scene: sceneInterceptionRules
      } = this.interceptionRules;

      try {
        let isIntercepted = false;
        const interceptions = [
          // scene interceptions has precedence over global interceptions
          ...sceneInterceptionRules,
          ...globalInterceptionRules
        ];
        for (const interception of interceptions) {
          if (checkRule(request, interception.rule, { compareUrl })) {
            // eslint-disable-next-line no-await-in-loop
            const response = await assembleResponse(
              request,
              interception.response,
              interceptedResponseDefaults
            );
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
