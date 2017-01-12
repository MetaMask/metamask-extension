
//
// synchronizeStore(inStore, outStore, stateTransform)
//
// keeps outStore synchronized with inStore, via an optional stateTransform
//

module.exports = synchronizeStore


function synchronizeStore(inStore, outStore, stateTransform) {
  stateTransform = stateTransform || transformNoop
  const initState = stateTransform(inStore.get())
  outStore.put(initState)
  inStore.subscribe((inState) => {
    const outState = stateTransform(inState)
    outStore.put(outState)
  })
  return outStore
}

function transformNoop(state) {
  return state
}