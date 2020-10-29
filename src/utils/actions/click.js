export default async function click(
  page,
  selector,
  { visible, hidden, waitTimeout = 5000, button, clickCount, clickDelay } = {}
) {
  await page.waitForSelector(selector, {
    visible,
    hidden,
    timeout: waitTimeout
  });
  await page.click(selector, {
    button,
    clickCount,
    delay: clickDelay
  });
}
