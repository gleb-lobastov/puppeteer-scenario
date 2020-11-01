export default async function click(
  page,
  selector,
  {
    visible,
    hidden,
    waitTimeout = 5000,
    button,
    clickCount,
    clickDelay,
    selectorIndex = 0
  } = {}
) {
  await page.waitForSelector(selector, {
    visible,
    hidden,
    timeout: waitTimeout
  });

  const clickOptions = {
    button,
    clickCount,
    delay: clickDelay
  };

  if (selectorIndex > 0) {
    const elementHandles = await page.$$(selector);
    if (!elementHandles[selectorIndex]) {
      throw new Error(
        `Can't find element by selector ${selector} at index ${selectorIndex}. Total: ${elementHandles.length} elements`
      );
    }
    await elementHandles[selectorIndex].click(clickOptions);
  } else {
    await page.click(selector, clickOptions);
  }
}
