export default function checkRule(
  request,
  interception,
  { compareUrl = defaultCompareUrl } = {}
) {
  const { url, response, responseByMethod } = interception;

  const urls = Array.isArray(url) ? url : [url];
  const requestUrl = request.url();
  if (!urls.some(urlToCompare => compareUrl(requestUrl, urlToCompare))) {
    return false;
  }

  const requestMethod = request.method();
  return Boolean(response || responseByMethod?.[requestMethod]);
}

function defaultCompareUrl(requestUrl, referenceUrl) {
  return new RegExp(referenceUrl).test(requestUrl);
}
