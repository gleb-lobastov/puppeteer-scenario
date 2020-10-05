import Scenario from "../../src/Scenario";
import JestScene from "../scenes/JestScene";

export default new Scenario("jest")
  .arrange({ scene: JestScene })
  .act("collectIssues")
  .assert(({ context }) => {
    expect(context.get("jestIssues")).toBeLessThan(1500);
  });
