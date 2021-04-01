import checkRule from "./checkRule";
import assembleResponse from "./assembleResponse";
import { logError } from "../utils/log";

export default class Interceptor {
  constructor(options = {}) {
    this.options = options;
    this.interceptionRules = {
      global: [],
      globalOnce: [],
      scene: [],
      sceneOnce: []
    };
    this.pagesWithInterception = new WeakSet();
    this.invoked = new WeakSet();
    this.context = null;
  }

  setContext(context) {
    this.context = context;
  }

  async updateInterceptionRules(
    page,
    { global, globalOnce, scene, sceneOnce }
  ) {
    if (global !== undefined && !Array.isArray(global)) {
      const tag = Object.prototype.toString.call(global);
      throw new Error(
        `Expected global intercept rules to be an array, but got ${tag}`
      );
    }
    if (scene !== undefined && !Array.isArray(scene)) {
      const tag = Object.prototype.toString.call(scene);
      throw new Error(
        `Expected scene intercept rules to be an array, but got ${tag}`
      );
    }
    this.interceptionRules = {
      global: global
        ? [...global, ...this.interceptionRules.global]
        : this.interceptionRules.global,
      globalOnce: globalOnce
        ? [
            ...globalOnce.map(rule => ({ ...rule, once: true })),
            ...this.interceptionRules.globalOnce
          ]
        : this.interceptionRules.globalOnce,
      scene: scene ?? this.interceptionRules.scene,
      sceneOnce:
        sceneOnce?.map(rule => ({ ...rule, once: true })) ??
        this.interceptionRules.sceneOnce
    };
    await this.setRequestInterceptionOnce(page);
  }

  async updatePage(page) {
    this.interceptionRules = {
      global: this.interceptionRules.global,
      globalOnce: this.interceptionRules.globalOnce
    };
    await this.setRequestInterceptionOnce(page);
  }

  async setRequestInterceptionOnce(page) {
    const {
      compareUrl,
      interceptionFilter = () => true,
      interceptedResponseDefaults
    } = this.options;

    if (this.pagesWithInterception.has(page)) {
      return;
    }
    this.pagesWithInterception.add(page);

    await page.setRequestInterception(true);
    await page.on("request", async request => {
      const {
        global: globalInterceptionRules,
        globalOnce: globalOnceInterceptionRules,
        scene: sceneInterceptionRules,
        sceneOnce: sceneOnceInterceptionRules
      } = this.interceptionRules;

      try {
        let isIntercepted = false;
        const interceptions = [
          // scene interceptions has precedence over global interceptions
          ...sceneOnceInterceptionRules,
          ...globalOnceInterceptionRules,
          ...sceneInterceptionRules,
          ...globalInterceptionRules
        ];
        for (const interception of interceptions) {
          if (
            interceptionFilter(request) &&
            checkRule(request, interception, { compareUrl })
          ) {
            // eslint-disable-next-line no-await-in-loop
            const response = await assembleResponse(
              request,
              interception,
              interceptedResponseDefaults,
              this.context
            );
            if (response !== null && response !== undefined) {
              if (interception.once && this.invoked.has(interception)) {
                break;
              }
              if (interception.keepContext) {
                this.context.set(interception.keepContext, {
                  headers: request.headers(),
                  method: request.method(),
                  postData: request.postData(),
                  resourceType: request.resourceType(),
                  response,
                  url: request.url()
                });
              }
              isIntercepted = true;
              if (interception.onBeforeIntercept) {
                interception.onBeforeIntercept.call(
                  interception,
                  request,
                  response
                );
              }
              if (interception.once) {
                this.invoked.add(interception);
              }
              request.respond(response);
            }
            break;
          }
        }

        if (!isIntercepted) {
          request.continue();
        }
      } catch (error) {
        logError(error);
      }
    });
  }
}
