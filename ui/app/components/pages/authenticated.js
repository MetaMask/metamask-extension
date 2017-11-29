const { connect } = require('react-redux')
const PropTypes = require('prop-types')
const { Redirect, Route } = require('react-router-dom')
const h = require('react-hyperscript')
const { UNLOCK_ROUTE, INITIALIZE_MENU_ROUTE } = require('../../routes')

const Authenticated = ({ component: Component, isUnlocked, isInitialized, ...props }) => {

  const render = props => {
    switch (true) {
      case isUnlocked:
        return h(Component, { ...props })
      case !isInitialized:
        return h(Redirect, { to: { pathname: INITIALIZE_MENU_ROUTE } })
      default:
        return h(Redirect, { to: { pathname: UNLOCK_ROUTE } })
    }
  }

  return (
    h(Route, {
      ...props,
      render,
    })
  )
}

Authenticated.propTypes = {
  component: PropTypes.func,
  isUnlocked: PropTypes.bool,
  isInitialized: PropTypes.bool,
}

const mapStateToProps = state => {
  const { metamask: { isUnlocked, isInitialized } } = state
  return {
    isUnlocked,
    isInitialized,
  }
}

module.exports = connect(mapStateToProps)(Authenticated)
