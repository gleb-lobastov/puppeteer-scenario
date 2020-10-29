export default async function type(
  page,
  selector,
  value,
  { visible, hidden, waitTimeout = 5000, typeDelay } = {}
) {
  await page.waitForSelector(selector, {
    visible,
    hidden,
    timeout: waitTimeout
  });
  await page.focus(selector);
  await page.type(selector, value, { delay: typeDelay });
}
