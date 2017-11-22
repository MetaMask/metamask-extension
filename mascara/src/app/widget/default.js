const { render } = require('react-dom')
const App = require('./App')
const h = require('react-hyperscript')

function setupDefaultWidget (container, publicConfigStore) {
  const rootElement = container.querySelector('#app')
  const renderProps = renderWithProps(App, rootElement)
  const props = {
    selectedAddress: publicConfigStore.getState().selectedAddress,
  }

  renderProps(props)

  publicConfigStore.subscribe(state => {
    if (state.selectedAddress === props.selectedAddress) {
      return
    }

    props.selectedAddress = state.selectedAddress
    renderProps(Object.assign({}, props))
  })
}

const renderWithProps = (Component, element) => props => {
  render(
    h(Component, props),
    element
  )
}

module.exports = setupDefaultWidget
