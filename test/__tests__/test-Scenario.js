import "regenerator-runtime";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import Scenario from "../../src";
import jestScenario from "../scenarios/jestScenario";
import puppeteerScenario from "../scenarios/puppeteerScenario";
import PuppeteerScene from "../scenes/PuppeteerScene";

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
      .assert(async ({ page }) => {
        const windowUrl = await page.evaluate(() => window.location.href);
        expect(windowUrl).toBe("https://github.com/puppeteer/puppeteer/issues");
      })
      .play({ page });
  }, 30000);

  it("should be able to include other scenarios", () => {
    return new Scenario({ name: "withInclusions" })
      .include(jestScenario)
      .include(puppeteerScenario)
      .assert(async ({ page }) => {
        const ariaLabel = await page.$eval(
          "[href*=stargazers]",
          element => element.ariaLabel
        );
        expect(parseFloat(ariaLabel)).toBeGreaterThan(65000);
      })
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
});
