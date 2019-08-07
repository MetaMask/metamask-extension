import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import ThreeBoxRestoreConfirm from './threebox-restore-confirm.component'
import { restoreFromThreeBox, setRestoredFromThreeBox, setThreeBoxSyncingPermission } from '../../../../store/actions'

const mapStateToProps = state => {
  return {
    address: state.metamask.selectedAddress,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    restoreFromThreeBox: (address) => dispatch(restoreFromThreeBox(address)),
    setRestoredFromThreeBox: (restored) => dispatch(setRestoredFromThreeBox(restored)),
    setThreeBoxSyncingPermission: (threeBoxSyncingAllowed) => dispatch(setThreeBoxSyncingPermission(threeBoxSyncingAllowed)),
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps)
)(ThreeBoxRestoreConfirm)
