export function camelCaseToCapitalize(str = '') {
  return str.replace(/([A-Z])/gu, ' $1').replace(/^./u, (s) => s.toUpperCase());
}
