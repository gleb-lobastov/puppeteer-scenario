![npm](https://img.shields.io/npm/v/puppeteer-scenario?logo=npm)

## Install

`npm i -D puppeteer-scenario`

## Description

Allow writing declarative and reusable scenarios for tests in puppeteer in AAA [(Arrange-Act-Assert)](https://github.com/testdouble/contributing-tests/wiki/Arrange-Act-Assert) pattern.

Idea is, that tests decomposed into two parts. High-level "scenario" part, where intentions are described. And low-level "scenes", where the actual puppeteer manipulations are performed

## Example

```javascript
describe("user scenarios", () => {
  it("should login, create trip, visits and rides", async () => {
    return new Scenario(page)
      .arrange({
        scene: LoginScene,
        url: "http://localhost:8080/mine/hello"
      })
      .act("login", {
        login: process.env.TEST_LOGIN,
        password: process.env.TEST_PASSWORD
      })
      .assert(() =>
        expect(page.evaluate(() => window.isAuthenticated)).toBeTruthy()
      )

      .arrange({ scene: VisitsScene, userLogin: process.env.TEST_LOGIN })
      .act("clickCreateTrip")

      .arrange({ scene: CreateTripScene })
      .act("createTrip")

      .arrange({ scene: EditTripScene })
      .act("createVisit")
      .act("createVisit")
      .act("createRide")
      .act("createRide")
      .act("createRide")
      .assert(async () => {
        expect(
          await page.$$(toSelector(tripEditPageLocators.VISIT_BLOCK))
        ).toHaveLength(2);
        expect(
          await page.$$(toSelector(tripEditPageLocators.RIDE_BLOCK))
        ).toHaveLength(3);
      })

      .play();
  });
});

// VisitsScene.js, for example
export default class VisitsScene extends Scene {
  async arrange({ userLogin }) {
    await this.page.goto(
      `${process.env.APP_ORIGIN}/mine/travel/${userLogin}/visits/trips`,
      { waitUntil: "networkidle2" }
    );
  }

  async clickCreateTrip() {
    const addTripButtonSelector = toSelector(
      visitsPageLocators.ADD_TRIP_BUTTON
    );

    await this.page.waitFor(addTripButtonSelector);
    await this.page.click(addTripButtonSelector);
  }
}
```

[Check more examples](examples/__tests__/test-ScenarioExamples.js)

## Usage

```javascript
import Scenario from "puppeteer-scenario";

describe("MyScenario", () => {
  it("should behave well", () => {
    return new Scenario({ name: "nameForLogs" })
      .include("...")

      .arrange("...")
      .act("...")
      .assert("...")

      .play("...");
  });
});
```

**constructor options:**

| option name | default value                             | description                                           |
| ----------- | ----------------------------------------- | ----------------------------------------------------- |
| name        | — (required)                              | scenario name to show in logs                         |
| screenshot  | { takeScreenshot:false }                  | screenshotOptions to configure on-failure screenshots |
| compareUrl  | new RegExp(referenceUrl).test(requestUrl) | see interception section                              |

**screenshotOptions:**

Has shortcut: true, equals to { takeScreenshot:true }

| name           | default value              | description                                                   |
| -------------- | -------------------------- | ------------------------------------------------------------- |
| takeScreenshot | true                       | if false, screenshot will not be taken                        |
| pathResolver   | see default filename below | signature: pathResolver(context, { scenarioName, sceneName }) |
| ...rest        | {}                         | options that passed to puppeteer page.screenshot(options)     |

Default file name for screenshots: .screenshots/${scenarioName}__${sceneName}\_\_\${uniqKey}.png

## API

### include

`include(otherScenario)` — copy all steps from other scenario to the current one (in place of the current step). Useful to include authorization steps. The other scenario remains unchanged

### arrange

`arrange(options)` — prepare page for test

**available options:**

| option name        | default value | description                                                      |
| ------------------ | ------------- | ---------------------------------------------------------------- |
| page               | —             | update current puppeteer page, if provided                       |
| url                | —             | navigate to url, if provided                                     |
| scene              | —             | setup current scene, if provided (see Scene section for details) |
| intercept          | —             | global interception rules, see Interception section              |
| context            | —             | object of key/value pairs to populate scenario context           |
| ...sceneProperties | {}            | params that forwarder to Scene instance arrange method           |

### act

`act(actionName, ...actionArgs)` — perform low-level action, that coded inside Scene class. actionName is the method name of Scene instance, args are arguments that will be passed to this method

### assert

`assert(callback, options)` — place to make assertions

**callback signature:**
`({page, scene, context}) => {/*...*/}`

**available options:**

| option name     | default value | description                          |
| --------------- | ------------- | ------------------------------------ |
| assertionsCount | 1             | how much assertions made by callback |

### play

`play(options)` — perform scenario and call all async actions

**available options:**

| option name | default value | description            |
| ----------- | ------------- | ---------------------- |
| page        | global.page   | initial puppeteer page |

## Scene

Scene is a representation of an application page (a view, not a puppeteer one) in the form of a class written by users of the library. Scene has such structure:

```javascript
export default class MyScene {
  constructor(page) {
    // Assumed, that scene instance is always used with same page
    this.page = page;
  }

  intercept = {
    regexp: context => ({
      /* puppeteer response https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#httprequestrespondresponse */
    })
  };

  // optional method, if present, will be called automatically after arrange call with new Scene in scenario
  async arrange(sceneProperties) {}

  async myMethod(context, ...actionArgs) {
    // use this.page to execute puppeteer commands here
  }
}
```

[Check example](examples/scenes/JestScene.js)

Library also exports a very simple Scene class, that just assign page and context fields in constructor. It possible to inherit Scenes from it, but not required.
[Source](./src/Scene.js)

## Context

Context is key-value in-memory storage, that could be used to pass some data through steps

## Interception

puppeteer-scenario use puppeteer page "request" event to subscribe and intercept requests. The usual purposes are to mock requests or to simulate the erroneous response

interceptions could be set by passing interceptions config in two ways:

1. "global" for the scenario, through .arrange({ intercept }) parameter. Interceptions added this way will work till the scenario end, if not overridden by further ones with the same keys. I.e. each next "global" config will be merged into existing
2. "local" for the scene. These interceptions are set in scene instance "intercept" field (see scene example). And works only for the scene where it was set. After scene change, such interceptions will be removed. I.e. each next "local" config will be substitute existing one

"local" interceptions have precedence over "global"

interceptions config is an object, which keys is representing URL and values:

```javascript
const interceptionsConfig = {
  "/api/request/": function interceptionFn(
    // https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#class-httprequest
    request,
    // puppeteer-scenario context, see "context" section
    context
  ) {
    return {
      content: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ value: 32 })
      // ...response
      // https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#httprequestrespondresponse
    };
  }
};
```

interception will be **ignored** if the function returns a null or undefined value

interception keys by default is treated as regexp, used to compare with requested urls:

(requestUrl, referenceUrl) => new RegExp(referenceUrl).test(requestUrl),

This behavior could be overridden by `compareUrl` param in Scenario constructor
