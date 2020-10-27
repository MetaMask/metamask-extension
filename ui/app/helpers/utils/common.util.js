export function camelCaseToCapitalize (str = '') {
  return str
    .replace(/([A-Z])/ug, ' $1')
    .replace(/^./u, (s) => s.toUpperCase())
}

export function removeDash (str = '') {
  return str
    .replace(/[-]/u, '')
}
