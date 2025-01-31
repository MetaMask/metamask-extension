/**
 * @param {string} id
 * @returns {string}
 */
const id2name = (id) => id.split('>').pop() || id

/** 
 * @returns {Record<string, { [key: string]: string[] }>} 
 */
const create = () => ({})

/**
 * @param {string[]} keys
 * @param {string} action
 * @returns {Record<string, { [key: string]: string[] }>}
 */
const aggregateAction = (keys, action) =>
  keys.reduce((aggr, key) => {
    const name = id2name(key)
    if (!aggr[name]) {
      aggr[name] = { [action]: [] }
    }
    aggr[name][action].push(key)
    return aggr
  }, create())

/**
 * @param {string[]} addedKeys
 * @param {string[]} removedKeys
 * @param {string[]} currentKeys
 */
const aggregateChangesByPackageName = (addedKeys, removedKeys, currentKeys) => {
  const addedPackages = aggregateAction(addedKeys, 'added')
  const removedPackages = aggregateAction(removedKeys, 'removed')
  const currentPackages = aggregateAction(currentKeys, 'current')

  const keysOfInterest = new Set([
    ...Object.keys(addedPackages),
    ...Object.keys(removedPackages),
  ])

  const aggr = create()

  for (const key of keysOfInterest) {
    aggr[key] = {
      added: addedPackages[key]?.added || [],
      removed: removedPackages[key]?.removed || [],
      current: currentPackages[key]?.current || [],
      unchanged: (currentPackages[key]?.current || []).filter(
        (x) => !addedPackages[key]?.added.includes(x)
      ),
    }
  }

  return aggr
}

/**
 * 
 * @param {string} str 
 */
const c = (str) => '`' + str + '`'

/**
 * @param {string[]} keys
 * @param {import('lavamoat-core').Resources} resources
 */
const findWhatDependsOn = (keys, resources) =>
  Object.entries(resources)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_, policy]) =>
      keys.some((key) => Object.keys(policy?.packages || {}).includes(key))
    )
    .map(([packageName]) => packageName)

/**
 * @param {import('lavamoat-core').Resources} previousJsonResources
 * @param {import('lavamoat-core').Resources} currentJsonResources
 */
function analyze(previousJsonResources, currentJsonResources) {
  
  const currentResources = new Set(Object.keys(currentJsonResources || {}))
  const previousResources = new Set(Object.keys(previousJsonResources || {}))

  const addedKeys = [...currentResources].filter(
    (x) => !previousResources.has(x)
  )
  const removedKeys = [...previousResources].filter(
    (x) => !currentResources.has(x)
  )

  const currentKeys = Object.keys(currentJsonResources)

  const aggr = aggregateChangesByPackageName(
    addedKeys,
    removedKeys,
    currentKeys
  )

  const report = Object.entries(aggr).map(
    ([packageName, { added, removed, current, unchanged }]) => {
      const addedKeys = added.map((key) => `+ ${key}`).join('\n')
      const removedKeys = removed.map((key) => `- ${key}`).join('\n')
      const unchangedKeys = unchanged.map((key) => ` ${key}`).join('\n')

      let comments = []
      if (current.length === 0 && removed.length > 0) {
        return `#### ${c(packageName)} have been removed.`
      } else {
        if (
          added.length > 0 &&
          added.length === current.length &&
          removed.length === 0
        ) {
          return `#### ${c(packageName)} a new package has been added.`
        }
        if (added.length > removed.length) {
          comments.push(
            `Added ${added.length - removed.length} new copies of the package. This is not an issue in itself, but make sure you intended that. Maybe can be deduplicated if you get versions to match.`
          )
          const broughtBy = findWhatDependsOn(
            added,
            currentJsonResources
          ).sort()
          if (broughtBy.length > 0) {
            comments.push(
              `The new copies are brought by some of the following: 
    ${broughtBy.map(c).join(', ')}`
            )
          } else {
            comments.push(
              `The new copies seem to be caused by version mismatch in updated dependents that prevented deduplication.`
            )
          }
        }
        if (added.length === removed.length) {
          if (
            added.length === 1 &&
            (added[0].split('>').length < removed[0].split('>').length ||
              (added[0].split('>').length === removed[0].split('>').length &&
                added[0].length < removed[0].length))
          ) {
            comments.push(
              `Dependency tree has changed and the shortest identifier of the ${c(packageName)} is now ${c(added[0])}, but there's no new copies of the package.`
            )
          } else {
            comments.push(
              `Dependency tree structure has changed, but there's the same number of versions of the package.`
            )
          }
        }

        const dependentsBefore = findWhatDependsOn(
          [...removed, ...unchanged],
          previousJsonResources
        )
          .map(id2name)
          .sort()
        const dependentsAfter = findWhatDependsOn(
          [...added, ...unchanged],
          currentJsonResources
        )
          .map(id2name)
          .sort()
        const dependentsBeforeStr = dependentsBefore.join(', ')
        const dependentsAfterStr = dependentsAfter.join(', ')
        if (
          dependentsBefore.length === dependentsAfter.length &&
          dependentsBeforeStr === dependentsAfterStr
        ) {
          comments.push(
            `The set of packages that depend on ${c(packageName)} has not changed.`
          )
        } else {
          comments.push(
            `The set of packages that depend on ${c(packageName)} has changed.
    Before: ${c(dependentsBeforeStr)}
    After: ${c(dependentsAfterStr)}`
          )
        }
      }

      return `
#### ${c(packageName)}
${comments.map((c) => '- ' + c).join('\n')}

${'```diff'}
${removedKeys}
${addedKeys}
${unchangedKeys}
${'```'}`
    }
  )

  if (report.length === 0) {
    return 'No changes in dependency structure detected.'
  }
  return report.join('\n')
}
exports.analyze = analyze
