export function getTokenValueParam(tokenData = {}) {
  return tokenData?.args?._value?.toString();
}
