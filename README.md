![npm](https://img.shields.io/npm/v/puppeteer-scenario?logo=npm)

Install:

```npm i -D puppeteer-scenario```

Allow to write declarative scenarios for tests in puppeteer like this:

```javascript
import puppeteer from "puppeteer";
import Scenario from "puppeteer-scenario";
import LoginScene from "./scenes/LoginScene";
import VisitsScene from "./scenes/VisitsScene";
import CreateTripScene from "./scenes/CreateTripScene";
import EditTripScene from "./scenes/EditTripScene";

const TEST_LOGIN = "...";
const TEST_PASSWORD = "...";
const TEST_USER_ALIAS = "...";

describe("user scenarios", () => {
  it("should login, create trip, visits and rides", async () => {
    jest.setTimeout(100000);
    expect.assertions(1);

    const browser = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      devtools: true
    });
    const page = await browser.newPage();
    Object.assign(global, { browser, page });

    await new Scenario(page)
      .showScene(LoginScene)
      .act("login", { login: TEST_LOGIN, password: TEST_PASSWORD })
      .then(({ isAuthorized }) => expect(isAuthorized).toBe(true))

      .showScene(VisitsScene, { userAlias: TEST_USER_ALIAS })
      .act("goCreateTrip")

      .expectScene(CreateTripScene)
      .act("createTrip")

      .expectScene(EditTripScene)
      .act(async editTripScene => {
        await editTripScene.createVisitDialogActions.createVisit();
        await editTripScene.createVisitDialogActions.createVisit();
        await editTripScene.createRideDialogActions.createRide();
        await editTripScene.createRideDialogActions.createRide();
        await editTripScene.createRideDialogActions.createRide();
      })

      .play();

    await page.waitForFunction("false", { timeout: 10000000 });
    await browser.close();
  });
});
```

Each scene is a class that represents particular view and provide some actions to execute in view

For example LoginScene:

```javascript
import * as loginPageLocators from "../src/LoginPage/locators";

export default class LoginScene {
  constructor(page) {
    this.page = page;
  }

  async show() {
    await this.page.goto("/mine/hello", { waitUntil: "networkidle2" });
  }

  async login({ login, password }) {
    const loginFieldSelector = toSelector(loginPageLocators.LOGIN_INPUT);
    await this.page.waitFor(loginFieldSelector);
    await this.page.evaluate(evaluateInputValue, loginFieldSelector, login);
    await this.page.evaluate(
      evaluateInputValue,
      toSelector(loginPageLocators.PASSWORD_INPUT),
      password
    );
    await this.page.click(toSelector(loginPageLocators.SUBMIT_BUTTON));
    await this.page.waitForResponse(url => url.includes("/api/login"));
    return { isAuthorized: Boolean(localStorage.get("authToken")) };
  }
}

function toSelector(locator) {
  return `[data-locator="${locator}"] `;
}

function evaluateInputValue(fieldSelector, value) {
  const element = document.querySelector(`${fieldSelector}`);
  element.value = value;
}
```
