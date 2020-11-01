import { Scenario } from "../../src";
import PuppeteerScene from "../scenes/PuppeteerScene";

export default new Scenario("puppeteer")
  .arrange({
    scene: PuppeteerScene,
    url: "https://github.com/puppeteer/puppeteer"
  })
  .act("collectIssues")
  .assert("issuesCount", {
    expect: "toBeLessThan",
    expectedValue: 1500
  })
  .assert("issuesCountOtherWay", {
    expect: "toBeLessThan",
    expectedValue: 1600
  });
