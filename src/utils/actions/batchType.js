import type from "./type";

export default function batchType(page, batchParams, options) {
  return Promise.all(
    batchParams.map(({ selector, value, options: particularOptions }) =>
      type(page, selector, value, { ...options, ...particularOptions })
    )
  );
}
