export default function invokeExpect(
  actualValue,
  expectationName,
  expectedValue
) {
  const expectationNameParts = expectationName.split(".");
  const boundExpect = invokeExpect.expectFn(actualValue);
  const matcher = expectationNameParts.reduce(
    (interimMatcher, expectationNamePart) =>
      interimMatcher[expectationNamePart],
    boundExpect
  );
  return matcher(expectedValue);
}
invokeExpect.expectFn = expect;
