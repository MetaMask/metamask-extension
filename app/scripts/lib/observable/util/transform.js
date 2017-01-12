
module.exports = transformStore


function transformStore(inStore, outStore, stateTransform) {
  const initState = stateTransform(inStore.get())
  outStore.put(initState)
  inStore.subscribe((inState) => {
    const outState = stateTransform(inState)
    outStore.put(outState)
  })
  return outStore
}