import Scenario from "../../src/Scenario";
import PuppeteerScene from "../scenes/PuppeteerScene";

export default new Scenario("puppeteer")
  .arrange({
    scene: PuppeteerScene,
    url: "https://github.com/puppeteer/puppeteer"
  })
  .act("collectIssues")
  .assert(({ context }) => {
    expect(context.get("puppeteerIssues")).toBeLessThan(1500);
  });
