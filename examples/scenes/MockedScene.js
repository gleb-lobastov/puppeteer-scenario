import { Scene } from "../../src";

export default class MockedScene extends Scene {
  intercept = [
    {
      url: "https://google.com/api/request/",
      response: () => ({
        content: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ value: "world" })
      })
    }
  ];

  evaluations = {
    html: async () => {
      const bodyHandle = await this.page.$("body");
      return this.page.evaluate(body => body.innerHTML, bodyHandle);
    }
  };

  async mockedRequest() {
    await this.page.evaluate(() => {
      return window
        .fetch("/api/request/")
        .then(response => response.json())
        .then(({ value }) => {
          window.document.body.innerHTML += ` ${value}`;
        });
    });
  }
}
