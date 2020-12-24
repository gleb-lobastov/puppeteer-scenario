export default function checkRule(
  request,
  rule,
  { compareUrl = defaultCompareUrl } = {}
) {
  if (typeof rule !== "string") {
    return false;
  }
  return compareUrl(request.url(), rule);
}

function defaultCompareUrl(requestUrl, referenceUrl) {
  return new RegExp(referenceUrl).test(requestUrl);
}
