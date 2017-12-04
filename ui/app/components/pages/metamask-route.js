const { connect } = require('react-redux')
const PropTypes = require('prop-types')
const { Route } = require('react-router-dom')
const h = require('react-hyperscript')

const MetamaskRoute = ({ component, mascaraComponent, isMascara, ...props }) => {
  return (
    h(Route, {
      ...props,
      component: isMascara && mascaraComponent ? mascaraComponent : component,
    })
  )
}

MetamaskRoute.propTypes = {
  component: PropTypes.func,
  mascaraComponent: PropTypes.func,
  isMascara: PropTypes.bool,
}

const mapStateToProps = state => {
  const { metamask: { isMascara } } = state
  return {
    isMascara,
  }
}

module.exports = connect(mapStateToProps)(MetamaskRoute)
