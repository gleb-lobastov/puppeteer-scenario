import { DEFAULT_TIMEOUT } from "../../consts";

export default async function type(
  page,
  selector,
  value,
  { visible, hidden, waitTimeout = DEFAULT_TIMEOUT, typeDelay, selection } = {}
) {
  await page.waitForSelector(selector, {
    visible,
    hidden,
    timeout: waitTimeout
  });
  if (selection) {
    await page.focus(selector);
    await page.$eval(
      selector,
      (element, { start, end, direction } = {}) =>
        element.setSelectionRange(start, end, direction),
      selection
    );
  } else {
    await page.click(selector, { clickCount: 3 });
  }
  await page.type(selector, value, { delay: typeDelay });
}
