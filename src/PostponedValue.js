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
    const [pathInContext] = this.args;
    return context.get(pathInContext);
  }
}

class PageEvaluation extends PostponedValue {
  resolve({ page }) {
    const [evaluation, { evaluationArgs, selectorStr, mode }] = this.args;
    if (!selectorStr) {
      return page.evaluate(evaluation, ...evaluationArgs);
    }
    if (mode === "all") {
      return page.$$eval(selectorStr, evaluation, ...evaluationArgs);
    }
    return page.$eval(selectorStr, evaluation, ...evaluationArgs);
  }
}

export function contextValue(pathInContext) {
  return new ContextValue(pathInContext);
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

export function withPostponedValues(values, context) {
  return asyncDeepMap(values, value => {
    switch (true) {
      case value instanceof ContextValue:
        return value.resolve({ context });
      case value instanceof PageEvaluation:
        return value.resolve({ page: context.getPage() });
      default:
        return value;
    }
  });
}
