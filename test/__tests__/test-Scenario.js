import "regenerator-runtime";
import puppeteer from "puppeteer";
import Scenario from "../../src/Scenario";
import JestScene from "../scenes/JestScene";
import PuppeteerScene from "../scenes/PuppeteerScene";

let browser;
let page;
beforeAll(async () => {
  browser = await puppeteer.launch({
    // headless: false,
    // slowMo: 50,
    // devtools: true
  });
  page = await browser.newPage();
});

afterAll(async () => {
  await browser.close();
});

const jestScenario = new Scenario("jest")
  .arrange({ scene: JestScene, url: "https://github.com/facebook/jest" })
  .act("collectIssues")
  .assert(({ context }) => {
    expect(context.get("jestIssues")).toBeLessThan(1500);
  });

const puppeteerScenario = new Scenario("puppeteer")
  .arrange({
    scene: PuppeteerScene,
    url: "https://github.com/puppeteer/puppeteer"
  })
  .act("collectIssues")
  .assert(({ context }) => {
    expect(context.get("puppeteerIssues")).toBeLessThan(1500);
  });

describe("Scenario", () => {
  it("should have not too much issues", () => {
    return new Scenario("both")
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
