
function getProviderRequest (state) {
  if (state.metamask.providerRequests.length > 0) {
    return state.metamask.providerRequests[0]
  }
}

export default {
  getProviderRequest,
}
