export default class PuppeteerScene {
  constructor(page) {
    this.page = page;
  }

  async collectIssues(context) {
    const title = await this.page.$eval(
      '[data-content="Issues"] + span.Counter',
      element => element.title
    );
    if (title) {
      context.set("puppeteerIssues", parseInt(title.replace(",", "")));
    }
  }

  async clickOnIssuesPageLink() {
    const issuesButton = await this.page.$('[data-content="Issues"]');
    await issuesButton.click();
    await this.page.waitForNavigation({ waitUntil: "networkidle2" });
  }
}
