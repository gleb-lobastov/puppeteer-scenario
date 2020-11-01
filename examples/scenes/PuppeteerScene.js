import { Scene, contextValue, evalSelector } from "../../src";

export default class PuppeteerScene extends Scene {
  evaluations = {
    issuesCount: contextValue("puppeteerIssues"),
    issuesCountOtherWay: () => this.context.get("puppeteerIssues"),
    stargazersCount: evalSelector("[href*=stargazers]", element =>
      parseFloat(element.ariaLabel)
    )
  };

  async collectIssues() {
    const title = await this.page.$eval(
      '[data-content="Issues"] + span.Counter',
      element => element.title
    );
    if (title) {
      this.context.set("puppeteerIssues", parseInt(title.replace(",", ""), 10));
    }
  }

  async clickOnIssuesPageLink() {
    const issuesButton = await this.page.$('[data-content="Issues"]');
    await issuesButton.click();
    await this.page.waitForNavigation({ waitUntil: "networkidle2" });
  }
}
