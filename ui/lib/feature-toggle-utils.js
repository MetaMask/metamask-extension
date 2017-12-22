function checkFeatureToggle (name) {
  const queryPairMap = window.location.search.substr(1).split('&')
    .map(pair => pair.split('='))
    .reduce((pairs, [key, value]) => ({...pairs, [key]: value }), {})
  const featureToggles = queryPairMap['ft'] ? queryPairMap['ft'].split(',') : []
  return Boolean(featureToggles.find(ft => ft === name))
}

module.exports = {
  checkFeatureToggle,
}
