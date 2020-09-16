export default class JestScene {
  constructor(page) {
    this.page = page;
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
