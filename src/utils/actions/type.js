export default async function type(
  page,
  selector,
  value,
  { visible, hidden, waitTimeout = 5000, typeDelay, selection } = {}
) {
  await page.waitForSelector(selector, {
    visible,
    hidden,
    timeout: waitTimeout
  });
  await page.focus(selector);
  if (selection) {
    await page.$eval(
      selector,
      (element, { start, end, direction } = {}) =>
        element.setSelectionRange(start, end, direction),
      selection
    );
  }
  await page.type(selector, value, { delay: typeDelay });
}
