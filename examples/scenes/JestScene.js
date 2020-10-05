import { Scene } from "../../src";

const JEST_GITHUB_URL = "https://github.com/facebook/jest";

export default class JestScene extends Scene {
  async arrange() {
    const windowUrl = await this.page.evaluate(() => window.location.href);
    if (windowUrl !== JEST_GITHUB_URL) {
      await this.page.goto(JEST_GITHUB_URL, { waitUntil: "networkidle2" });
    }
  }

  async collectIssues() {
    const title = await this.page.$eval(
      '[data-content="Issues"] + span.Counter',
      element => element.title
    );
    if (title) {
      this.context.set("jestIssues", parseInt(title.replace(",", ""), 10));
    }
  }
}
