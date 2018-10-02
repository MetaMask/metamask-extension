import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../higher-order-components/with-modal-props'
import ForceInjectionComponent from './force-injection.component'
import { forceInjection } from '../../../actions'

const mapDispatchToProps = dispatch => {
  return {
    forceInjection: () => dispatch(forceInjection()),
  }
}

export default compose(
  withModalProps,
  connect(null, mapDispatchToProps)
)(ForceInjectionComponent)
