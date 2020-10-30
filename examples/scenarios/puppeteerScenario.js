import { Scenario, contextValue } from "../../src";
import PuppeteerScene from "../scenes/PuppeteerScene";

export default new Scenario("puppeteer")
  .arrange({
    scene: PuppeteerScene,
    url: "https://github.com/puppeteer/puppeteer"
  })
  .act("collectIssues")
  .assert(contextValue("puppeteerIssues"), { expect: { toBeLessThan: 1500 } });
