import Scenario from "../Scenario";

describe("scenario preset", () => {
  it("should arrange in preset if arrange option is present", async () => {
    const callback = jest.fn();
    const arrangeScenario = new Scenario({
      name: "Arrange Scenario"
    }).act(callback);

    const PresetScenario = Scenario.preset({ arrange: arrangeScenario });
    await new PresetScenario({ name: "Test Scenario" }).play();

    expect(callback).toBeCalledTimes(1);
  });

  it("should include arrange scenario in preset if arrange option is instance of Scenario", async () => {
    const callback = jest.fn();
    const arrangeScenario = new Scenario({
      name: "Arrange Scenario"
    }).act(callback);

    const PresetScenario = Scenario.preset({ arrange: arrangeScenario });
    await new PresetScenario({ name: "Test Scenario" }).play();

    expect(callback).toBeCalledTimes(1);
  });
});
