export default function assembleResponse(
  request,
  responseArg,
  responseDefaults = {}
) {
  const responseConfig =
    typeof responseArg === "function" ? responseArg() : responseArg;

  const responseParams =
    typeof responseConfig === "string"
      ? { body: responseConfig }
      : responseConfig;

  if (responseParams === null) {
    return null;
  }

  return { ...responseDefaults, ...responseParams };
}
