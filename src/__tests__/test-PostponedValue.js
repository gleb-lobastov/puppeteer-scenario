import {
  contextValue,
  evaluate,
  evalSelector,
  evalSelectorAll,
  withPostponedValues
} from "../PostponedValue";
import ScenarioContext from "../ScenarioContext";
import PageMock from "./mocks/PageMock";

describe("ContextValue", () => {
  it("should be populated from context", async () => {
    const context = new ScenarioContext(null);
    const firstContextValue = "firstContextValue";
    const secondContextValue = { v: "secondContextValue" };
    context.set("path.in.context", firstContextValue);
    context.set("otherPath", secondContextValue);

    expect.assertions(1);
    expect(
      await withPostponedValues(
        {
          some: { path: [0, contextValue("path.in.context"), 1] },
          otherOne: contextValue("otherPath"),
          justValue: 21
        },
        context
      )
    ).toEqual({
      some: { path: [0, firstContextValue, 1] },
      otherOne: secondContextValue,
      justValue: 21
    });
  });
});

describe("PageEvaluation", () => {
  describe("evaluation", () => {
    it("should evaluate evaluation", async () => {
      const context = new ScenarioContext(new PageMock());
      const firstValue = "firstValue";
      const secondValue = "secondValue";

      expect.assertions(1);
      expect(
        await withPostponedValues(
          {
            some: {
              path: [0, evaluate(valueCopy => valueCopy, firstValue), 1]
            },
            otherOne: evaluate(valueCopy => valueCopy, secondValue),
            justValue: 21
          },
          context
        )
      ).toEqual({
        some: { path: [0, firstValue, 1] },
        otherOne: secondValue,
        justValue: 21
      });
    });
  });

  describe("evalSelector", () => {
    it("should evaluate evalSelector", async () => {
      const context = new ScenarioContext(new PageMock());
      const firstSelector = "firstSelector";
      const secondSelector = "secondSelector";

      const evalFn = jest.fn(value => value);

      expect.assertions(2);
      expect(
        await withPostponedValues(
          {
            some: { path: [0, evalSelector(firstSelector, value => value), 1] },
            otherOne: evalSelector(secondSelector, evalFn),
            justValue: 21
          },
          context
        )
      ).toEqual({
        some: { path: [0, firstSelector, 1] },
        otherOne: secondSelector,
        justValue: 21
      });
      expect(evalFn.mock.calls).toHaveLength(1);
    });
  });

  describe("evalSelectorAll", () => {
    it("should evaluate evalSelectorAll", async () => {
      const context = new ScenarioContext(new PageMock());
      const firstSelector = "firstSelector";
      const secondSelector = "secondSelector";

      const evalFn = jest.fn(value => value);

      expect.assertions(2);
      expect(
        await withPostponedValues(
          {
            some: {
              path: [0, evalSelectorAll(firstSelector, value => value), 1]
            },
            otherOne: evalSelectorAll(secondSelector, evalFn),
            justValue: 21
          },
          context
        )
      ).toEqual({
        some: { path: [0, [firstSelector], 1] },
        otherOne: [secondSelector],
        justValue: 21
      });
      expect(evalFn.mock.calls).toHaveLength(1);
    });
  });
});

describe("ModifiedValue", () => {
  it("should be modified", async () => {
    const context = new ScenarioContext(new PageMock());
    const ctxValue = "ctxValue";
    const pageValue = "pageValue";
    context.set("path", ctxValue);

    const modifier = value => `${value}!`;

    expect.assertions(1);
    expect(
      await withPostponedValues(
        [
          contextValue("path").modify(modifier),
          evaluate(valueCopy => valueCopy, pageValue).modify(modifier)
        ],
        context
      )
    ).toEqual([modifier(ctxValue), modifier(pageValue)]);
  });
});
