import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import ThreeBoxRestoreConfirm from './threebox-restore-confirm.component'
import { restoreFromThreeBox } from '../../../../store/actions'

const mapStateToProps = state => {
  return {
    address: state.metamask.selectedAddress,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    restoreFromThreeBox: (address) => dispatch(restoreFromThreeBox(address)),
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps)
)(ThreeBoxRestoreConfirm)
