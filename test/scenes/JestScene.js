const JEST_GITHUB_URL = "https://github.com/facebook/jest";

export default class JestScene {
  constructor(page) {
    this.page = page;
  }

  async arrange() {
    const windowUrl = await this.page.evaluate(() => window.location.href);
    if (windowUrl !== JEST_GITHUB_URL) {
      await this.page.goto(JEST_GITHUB_URL, { waitUntil: "networkidle2" });
    }
  }

  async collectIssues(context) {
    const title = await this.page.$eval(
      '[data-content="Issues"] + span.Counter',
      element => element.title
    );
    if (title) {
      context.set("jestIssues", parseInt(title.replace(",", "")));
    }
  }
}
