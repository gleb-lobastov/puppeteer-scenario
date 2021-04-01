export default function checkRule(
  request,
  interception,
  { compareUrl = defaultCompareUrl } = {}
) {
  const { url, response, method, responseByMethod } = interception;

  const urls = Array.isArray(url) ? url : [url];
  const requestUrl = request.url();
  if (!urls.some(urlToCompare => compareUrl(requestUrl, urlToCompare))) {
    return false;
  }

  const requestMethod = request.method();
  if (response) {
    return !method || method === requestMethod;
  }
  return Boolean(responseByMethod?.[requestMethod]);
}

function defaultCompareUrl(requestUrl, referenceUrl) {
  return new RegExp(referenceUrl).test(requestUrl);
}
