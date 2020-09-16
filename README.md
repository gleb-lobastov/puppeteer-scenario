![npm](https://img.shields.io/npm/v/puppeteer-scenario?logo=npm)

## Install

`npm i -D puppeteer-scenario`

## Description

Allow writing declarative and reusable scenarios for tests in puppeteer in AAA [(Arrange-Act-Assert)](https://github.com/testdouble/contributing-tests/wiki/Arrange-Act-Assert) pattern.

Idea is, that tests decomposed into two parts. High-level "scenario" part, where intentions are described. And low-level "scenes", where the actual puppeteer manipulations are performed

## Example

[Check example](./test/__tests__/test-Scenario.js)

## Usage

```javascript
import Scenario from "puppeteer-scenario";

describe("MyScenario", () => {
  it("should behave well", () => {
    return new Scenario("nameForLogs")
      .include("...")

      .arrange("...")
      .act("...")
      .assert("...")

      .play("...");
  });
});
```

## API

`include(otherScenario)` — copy all steps from other scenario to the current one (in place of the current step). Useful to include authorization steps. The other scenario remains unchanged

`arrange(options)` — prepare page for test

available options:

| option name        | default value | description                                                      |
| ------------------ | ------------- | ---------------------------------------------------------------- |
| page               | —             | update current puppeteer page, if provided                       |
| url                | —             | navigate to url, if provided                                     |
| scene              | —             | setup current scene, if provided (see Scene section for details) |
| ...sceneProperties | {}            | params that forwarder to Scene instance arrange method           |

`act(actionName, ...actionArgs)` — perform low-level action, that coded inside Scene class. actionName is the method name of Scene instance, args are arguments that will be passed to this method

`assert(callback, options)` — place to make assertions

callback signature:
`({page, scene, context}) => {/*...*/}`

available options:

| option name     | default value | description                          |
| --------------- | ------------- | ------------------------------------ |
| assertionsCount | 1             | how much assertions made by callback |

`play(options)` — perform scenario and call all async actions

available options:

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

  // optional method, if present, will be called automatically after arrange call with new Scene in scenario
  async arrange(sceneProperties) {}

  async myMethod(context, ...actionArgs) {
    // use this.page to execute puppeteer commands here
  }
}
```

[Check example](./test/scenes/JestScene.js)
