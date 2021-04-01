/* eslint-disable max-classes-per-file */
import asyncDeepMap from "./utils/asyncDeepMap";
import { DEFAULT_TIMEOUT } from "./consts";

class PostponedValue {
  constructor(...args) {
    this.args = args;
  }

  // eslint-disable-next-line class-methods-use-this,no-unused-vars
  resolve(context) {
    throw new Error(
      "resolver is not implemented in PostponedValue abstract class"
    );
  }

  modify(modifier) {
    return new ModifiedValue(this, modifier);
  }
}

class ModifiedValue extends PostponedValue {
  async resolve(context) {
    const [originalValue, modifier] = this.args;
    const originalResult = await originalValue.resolve(context);
    return modifier(originalResult);
  }
}

class ContextValue extends PostponedValue {
  async resolve(context) {
    const [pathInContext, optionsOrModifier] = this.args;
    const { modifier, wait = true, timeout } =
      typeof optionsOrModifier === "function"
        ? { modifier: optionsOrModifier }
        : optionsOrModifier ?? {};

    const value = wait
      ? await context.wait(pathInContext, timeout)
      : context.get(pathInContext);

    if (modifier) {
      return modifier(value);
    }
    return value;
  }
}

class PageEvaluation extends PostponedValue {
  async resolve(context) {
    const page = context.getPage();
    const [
      evaluation,
      { evaluationArgs, selectorStr, mode, timeout = DEFAULT_TIMEOUT }
    ] = this.args;
    if (!selectorStr) {
      return page.evaluate(evaluation, ...evaluationArgs);
    }
    if (timeout) {
      await page.waitForSelector(selectorStr, { timeout });
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

export function contextValue(pathInContext, optionsOrModifier) {
  return new ContextValue(pathInContext, optionsOrModifier);
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
      case value instanceof PostponedValue:
        return value.resolve(context);
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
