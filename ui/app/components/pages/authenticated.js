const { connect } = require('react-redux')
const PropTypes = require('prop-types')
const { Redirect } = require('react-router-dom')
const h = require('react-hyperscript')
const MetamaskRoute = require('./metamask-route')
const { UNLOCK_ROUTE, INITIALIZE_ROUTE } = require('../../routes')

const Authenticated = props => {
  const { isUnlocked, isInitialized } = props

  switch (true) {
    case isUnlocked && isInitialized:
      return h(MetamaskRoute, { ...props })
    case !isInitialized:
      return h(Redirect, { to: { pathname: INITIALIZE_ROUTE } })
    default:
      return h(Redirect, { to: { pathname: UNLOCK_ROUTE } })
  }
}

Authenticated.propTypes = {
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
