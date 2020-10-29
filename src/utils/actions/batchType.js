import type from "./type";

export default function batchType(page, batchValues, options) {
  return Promise.all(
    batchValues.map(({ selector, value }) =>
      type(page, selector, value, options)
    )
  );
}
