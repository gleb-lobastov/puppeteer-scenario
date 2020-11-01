/* eslint-disable max-classes-per-file */
import asyncDeepMap from "./utils/asyncDeepMap";

class PostponedValue {
  constructor(...args) {
    this.args = args;
  }

  // eslint-disable-next-line class-methods-use-this
  resolve() {
    throw new Error(
      "resolver is not implemented in PostponedValue abstract class"
    );
  }
}

class ContextValue extends PostponedValue {
  resolve({ context }) {
    const [pathInContext, modifier] = this.args;
    const value = context.get(pathInContext);
    if (modifier) {
      return modifier(value);
    }
    return value;
  }
}

class PageEvaluation extends PostponedValue {
  resolve({ page }) {
    const [evaluation, { evaluationArgs, selectorStr, mode }] = this.args;
    if (!selectorStr) {
      return page.evaluate(evaluation, ...evaluationArgs);
    }
    if (mode === "all") {
      return page.$$eval(selectorStr, evaluation ?? els, ...evaluationArgs);
    }
    return page.$eval(selectorStr, evaluation ?? el, ...evaluationArgs);
  }
}

function el(element) {
  return element.innerHTML;
}

function els(elements) {
  return elements.map(element => element.innerHTML);
}

export function contextValue(pathInContext, modifier) {
  return new ContextValue(pathInContext, modifier);
}

export function evaluate(evaluation, ...evaluationArgs) {
  return new PageEvaluation(evaluation, { evaluationArgs });
}

export function evalSelector(selectorStr, evaluation, ...evaluationArgs) {
  return new PageEvaluation(evaluation, { selectorStr, evaluationArgs });
}

export function evalSelectorAll(selectorStr, evaluation, ...evaluationArgs) {
  return new PageEvaluation(evaluation, {
    selectorStr,
    evaluationArgs,
    mode: "all"
  });
}

const ArrayContaining = expect.arrayContaining([]).constructor;
const ObjectContaining = expect.objectContaining({}).constructor;

export function withPostponedValues(values, context) {
  return asyncDeepMap(values, value => {
    switch (true) {
      case value instanceof ContextValue:
        return value.resolve({ context });
      case value instanceof PageEvaluation:
        return value.resolve({ page: context.getPage() });
      case ArrayContaining && value instanceof ArrayContaining:
      case ObjectContaining && value instanceof ObjectContaining:
        return withPostponedValues(value.sample, context).then(resolved => {
          // eslint-disable-next-line no-param-reassign
          value.sample = resolved;
          return value;
        });

      default:
        return value;
    }
  });
}
