module.exports = setupDefaultWidget

function setupDefaultWidget (container, publicConfigStore) {
  const selectedAddressContainer = document.createElement('div')
  let selectedAddress = publicConfigStore.getState().selectedAddress || 'Login or Sign up'

  publicConfigStore.subscribe((state) => {
    if (state.selectedAddress === selectedAddress) return
    selectedAddress = state.selectedAddress || 'Login or Sign up'
    selectedAddressContainer.innerText = selectedAddress
  })

  selectedAddressContainer.innerText = selectedAddress
  container.appendChild(selectedAddressContainer)
}
