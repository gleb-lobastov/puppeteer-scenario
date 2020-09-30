import path from "path";
import fs from "fs";
import getSceneName from "./getSceneName";

export default function takeScreenshotIfNeeded(
  scenario,
  context,
  screenshotOptions
) {
  const {
    takeScreenshot,
    pathResolver = getDefaultScreenshotPath,
    ...forwardingOptions
  } = screenshotOptions;

  if (!takeScreenshot) {
    return;
  }

  const scenarioName = scenario.name;
  const sceneName = getSceneName(context.getScene()) || "";
  const screenshotPath = pathResolver(context, { scenarioName, sceneName });

  if (!screenshotPath) {
    return;
  }

  const dirname = path.dirname(screenshotPath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }

  return context.getPage().screenshot({
    ...forwardingOptions,
    path: screenshotPath
  });
}

function getDefaultScreenshotPath(context, { scenarioName, sceneName }) {
  const uniqKey = new Date().toISOString().replace(/:/g, "-");
  const filename = `${scenarioName}__${sceneName}__${uniqKey}.png`;
  return path.join(process.cwd(), ".screenshots", filename);
}
