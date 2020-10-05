export default class SceneMock {
  static preset({ arrange, intercept, ...actions }) {
    return function PresetSceneMock(...args) {
      const scene = new SceneMock(...args);
      if (intercept) {
        scene.intercept = intercept;
      }
      if (arrange) {
        scene.arrange = jest.fn(arrange);
      }
      Object.entries(actions).forEach(([actionName, action]) => {
        scene[actionName] = action;
      });
      return scene;
    };
  }

  constructor(page, context) {
    this.page = page;
    this.context = context;
  }

  arrange = jest.fn();
}
