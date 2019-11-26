import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import ClearPluginsComponent from './clear-plugins.component'
import { clearPlugins } from '../../../../store/actions'

const mapDispatchToProps = dispatch => {
  return {
    clearPlugins: () => dispatch(clearPlugins()),
  }
}

export default compose(
  withModalProps,
  connect(null, mapDispatchToProps)
)(ClearPluginsComponent)
