const { connect } = require('react-redux')
const PropTypes = require('prop-types')
const { Redirect } = require('react-router-dom')
const h = require('react-hyperscript')
const { INITIALIZE_ROUTE } = require('../../routes')
const MetamaskRoute = require('./metamask-route')

const Initialized = props => {
  return props.isInitialized
    ? h(MetamaskRoute, { ...props })
    : h(Redirect, { to: { pathname: INITIALIZE_ROUTE } })
}

Initialized.propTypes = {
  isInitialized: PropTypes.bool,
}

const mapStateToProps = state => {
  const { metamask: { isInitialized } } = state
  return {
    isInitialized,
  }
}

module.exports = connect(mapStateToProps)(Initialized)
