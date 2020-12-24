import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import { Scenario, evaluate, contextValue } from "../../src";
import jestScenario from "../scenarios/jestScenario";
import puppeteerScenario from "../scenarios/puppeteerScenario";
import PuppeteerScene from "../scenes/PuppeteerScene";
import MockedScene from "../scenes/MockedScene";

let browser;
let page;
beforeAll(async () => {
  const debugConfig = {
    headless: false,
    slowMo: 50,
    devtools: true
  };
  browser = await puppeteer.launch(
    process.env.DEBUG_PUPPETEER_SCENARIO ? debugConfig : {}
  );
  page = await browser.newPage();
});

afterAll(async () => {
  await browser.close();
});

describe("scenarios", () => {
  it("should provide API for AAA (Arrange-Act-Assert) testing pattern", () => {
    return new Scenario({ name: "default" })
      .arrange({
        scene: PuppeteerScene,
        url: "https://github.com/puppeteer/puppeteer"
      })
      .act("clickOnIssuesPageLink")
      .assert(evaluate(() => window.location.href), {
        expect: "toBe",
        expectedValue: "https://github.com/puppeteer/puppeteer/issues"
      })
      .play({ page });
  }, 30000);

  it("should be able to include other scenarios", () => {
    return new Scenario({ name: "withInclusions" })
      .include(jestScenario)
      .include(puppeteerScenario)
      .play({ page });
  }, 30000);

  it("should take screenshot after failure", async () => {
    expect.assertions(1);
    const SCREENSHOT_FILE_NAME = path.join(process.cwd(), "screenshot.png");

    await new Scenario({
      name: "withScreenshots",
      screenshot: { pathResolver: () => SCREENSHOT_FILE_NAME }
    })
      .arrange({ url: "https://google.com" })
      .assert(
        () => {
          throw new Error("Oh no");
        },
        { assertionsCount: 0 }
      )
      .play({ page })
      .catch(() => {});

    const isScreenshotExists = fs.existsSync(SCREENSHOT_FILE_NAME);
    try {
      expect(isScreenshotExists).toBe(true);
    } finally {
      if (isScreenshotExists) {
        fs.unlinkSync(SCREENSHOT_FILE_NAME);
      }
    }
  }, 30000);

  it("should intercept requests", () => {
    return new Scenario({ name: "withInterceptions" })
      .arrange({
        scene: MockedScene,
        url: "https://google.com/",
        intercept: [
          {
            url: "https://google.com/$",
            response: () => ({
              contentType: "text/html",
              body: '<html lang="en"><body>Hello</body></html>'
            })
          }
        ]
      })
      .act("mockedRequest")
      .assert("html", { expect: "toBe", expectedValue: "Hello world" })
      .play({ page });
  }, 30000);

  it("should be able to use predefined evaluations", () => {
    return new Scenario({ name: "withInclusions" })
      .arrange({
        url: "https://github.com/puppeteer/puppeteer",
        context: { minimalExpectedStargazers: 65000 },
        scene: PuppeteerScene
      })
      .assert("stargazersCount", {
        expect: "toBeGreaterThan",
        expectedValue: contextValue("minimalExpectedStargazers")
      })
      .play({ page });
  }, 30000);
});

/*
assert
  evaluation
    string -> call on scene with options.params
    function -> call as scene fn with this and with options.params
    other -> treat as postponed value
  options
    params: evaluationParams
    expect: kind of expectation (default "toEquals:)
    expected:
      string -> call on scene with options.expectedParams
      function -> call as scene fn with this and with options.expectedParams
      other -> treat as postponed value
    expectedParams: evaluationParams
    
    
Other considered variants:
LOW LEVEL ASSERT 
      .assert(
        evalSelector("[href*=stargazers]", element =>
          parseFloat(element.ariaLabel)
        ),
        "toBeGreaterThan",
        65000
      )

no way to hide implementation inside scene. Because exist cases, where need to pass params down to the scene
(update one, specified of existed items, that exist on page)
DIRECT CALL ON EXPECT
      .assert("evaluateStargazersCount", stargazersCount =>
        expect(stargazersCount).toBeGreaterThan(65000)
      )
direct call on expect is not convenient, because need to watch for assertions count,
and cant apply postponed values as expected

also its complicated if need to turn first argument into function

MANUAL SCENE MANIPULATION
      .assert(async scene =>
        expect(await scene.stargazersCount({ id: 200 })).toBeGreaterThan(
          await scene.resolve(contextValue("expectedStargazersCount"))
        )
      )

add too much place to make all things manual, and dont follow separate of abstractions conception
also postponed values became complicated to use and generally not usable
 */
