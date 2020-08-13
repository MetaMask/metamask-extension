export function camelCaseToCapitalize (str = '') {
  return str
    .replace(/([A-Z])/ug, ' $1')
    .replace(/^./u, (str) => str.toUpperCase())
}
