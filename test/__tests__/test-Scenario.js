import "regenerator-runtime";
import puppeteer from "puppeteer";
import Scenario from "../../src/Scenario";
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
  browser = await puppeteer.launch(process.env.DEBUG ? debugConfig : {});
  page = await browser.newPage();
});

afterAll(async () => {
  await browser.close();
});

describe("scenarios", () => {
  it("should provide API for AAA (Arrange-Act-Assert) testing pattern", () => {
    return new Scenario("default")
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
    return new Scenario("withInclusions")
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
});
