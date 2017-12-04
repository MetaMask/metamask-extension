const { connect } = require('react-redux')
const PropTypes = require('prop-types')
const { Redirect } = require('react-router-dom')
const h = require('react-hyperscript')
const { INITIALIZE_ROUTE } = require('../../../routes')
const MetamaskRoute = require('../metamask-route')

const Unauthenticated = ({ component: Component, isInitialized, ...props }) => {
  const component = renderProps => {
    return isInitialized
      ? h(Component, { ...renderProps })
      : h(Redirect, { to: { pathname: INITIALIZE_ROUTE } })
  }

  return (
    h(MetamaskRoute, {
      ...props,
      component,
    })
  )
}

Unauthenticated.propTypes = {
  component: PropTypes.func,
  isInitialized: PropTypes.bool,
  isMascara: PropTypes.bool,
  mascaraComponent: PropTypes.func,
}

const mapStateToProps = state => {
  const { metamask: { isInitialized, isMascara } } = state
  return {
    isInitialized,
    isMascara,
  }
}

module.exports = connect(mapStateToProps)(Unauthenticated)
