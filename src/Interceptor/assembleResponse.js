export default function assembleResponse(
  request,
  interception,
  responseDefaults = {},
  context
) {
  const responseArg = pickResponseArg(interception, request);
  const responseObject = resolveResponseObject(responseArg, request, context);

  if (responseObject === null) {
    return null;
  }

  return {
    ...responseDefaults,
    ...responseObject
  };
}

function pickResponseArg({ response, responseByMethod }, request) {
  const foundResponseByMethod = responseByMethod?.[request.method()];
  return foundResponseByMethod === undefined ? response : foundResponseByMethod;
}

function resolveResponseObject(responseArg, request, context) {
  const response =
    typeof responseArg === "function"
      ? responseArg(request, context)
      : responseArg;
  if (typeof response === "string") {
    return { body: response };
  }
  return response;
}
