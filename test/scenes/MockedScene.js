export default class MockedScene {
  constructor(page) {
    this.page = page;
  }

  intercept = {
    "https://google.com/api/request/": () => ({
      content: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ value: "world" })
    })
  };

  async mockedRequest() {
    await this.page.evaluate(() => {
      return window
        .fetch("/api/request/")
        .then(response => response.json())
        .then(({ value }) => {
          document.body.innerHTML += ` ${value}`;
        });
    });
  }
}
