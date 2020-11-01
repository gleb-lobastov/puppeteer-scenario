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
      .assert(evaluate(() => window.isAuthenticated), {
        expect: { toBe: true }
      })

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
      .assert(
        async () => {
          expect(
            await page.$$(toSelector(tripEditPageLocators.VISIT_BLOCK))
          ).toHaveLength(2);
          expect(
            await page.$$(toSelector(tripEditPageLocators.RIDE_BLOCK))
          ).toHaveLength(3);
        },
        { assertionsCount: 2 }
      )

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
import { Scenario } from "puppeteer-scenario";

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

`assert(evaluation, options)` — place to make assertions

evaluation could be function (callback), string, object, array or postponedValue

**available options:**

| option name      | default value | description                                                                                         |
| ---------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| expect           | 'toEqual'     | jest matcher name (expectationName)                                                                 |
| expectedValue    | —             | value to compare with                                                                               |
| evaluationParams | []            | params that will be passed to scene evaluation                                                      |
| assertionsCount  | 1             | how much assertions made by callback,required for callback, calculated automatically in other cases |

**evaluation**
the evaluation has 3 cases of resolution:
— if it is an object, array, or postponed value it remains as is
— if it is a string, then current scene will be addressed, it `evaluations[evaluation]` method will be called, and return value will be used
— if it is function, then it will be called with `({page, scene, context}) => {/*...*/}` signature, and return value will be used
NOTE: in last case, assertionsCount parameter is required. Because otherwise it's to easy to forget about it. And in that case tests could be successful, just because jest expect less assertions, that exist in fact

All postponed values and promises will be resolved in the return value, on all nested levels
for array or object (doesn't matter if it's a primitive or complex object). And the result passed
to jest "expect" check as in example:

```javascript
expect(resolvedEvaluation)[expectationName](expectedValue);
```

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
  constructor(page, context) {
    // Assumed, that scene instance is always used with same page
    this.page = page;
    this.context = context;
  }

  intercept = {
    regexp: request => ({
      /* puppeteer response https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#httprequestrespondresponse */
    })
  };

  evaluate = {
    // see "evaluation" section
    getBodyInnerHTML: async () => {
      return await this.page.$eval("body", body => body.innerHTML);
    }
  };

  // optional method, if present, will be called automatically after arrange call with new Scene in scenario
  async arrange(sceneProperties) {}

  async myMethod(...actionArgs) {
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

## Advanced

### Scenario preset

It is possible to make scenario preset:

```javascript
const MyScenarioConstructor = Scenario.preset({
  arrangeScenario,
  ...scenarioOptions
});
```

| option name     | default value | description                                                                  |
| --------------- | ------------- | ---------------------------------------------------------------------------- |
| arrangeScenario | —             | scenario to include by default can be convenient for authorization           |
| scenarioOptions | {}            | options applicable to Scenario constructor (see constructor options section) |

Options passed as scenarioOptions will be treated as default values.

Note: instances created by Scenario preset nevertheless are instances of Scenario class:

```
const scenario = new MyScenarioConstructor() ;
console.log(scenario instanceof Scenario) // true
```

## Postponed values

Postponed values are a mechanism that helps to write simple and concise references to often required
evaluations, such as context values or page evaluations

```javascript
import {
  contextValue,
  evaluate,
  evalSelector,
  evalSelectorAll
} from "puppeteer-scenario";

new Scenario("test")
  .act(/*...*/)
  .assert(contextValue("myContextValue"), { expectedValue: "value" })
  .assert(evaluate(() => window.location.host), { expectedValue: "google.com" })
  .assert(evalSelector("body", body => body.innerHTML), {
    expectedValue: "hello"
  })
  .assert(evalSelectorAll(".player"), {
    expect: "toHaveLength",
    expectedValue: 4
  });
```
