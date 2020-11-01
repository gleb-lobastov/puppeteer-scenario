import { Scenario, contextValue } from "../../src";
import JestScene from "../scenes/JestScene";

export default new Scenario("jest")
  .arrange({ scene: JestScene })
  .act("collectIssues")
  .assert(contextValue("jestIssues"), {
    expect: "toBeLessThan",
    expectedValue: 1400
  });
