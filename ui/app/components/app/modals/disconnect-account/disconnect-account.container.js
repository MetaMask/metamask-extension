import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import DisconnectAccount from './disconnect-account.component'
import { getCurrentAccountWithSendEtherInfo } from '../../../../selectors/selectors'
import { removePermissionsFor } from '../../../../store/actions'

const mapStateToProps = state => {
  return {
    ...state.appState.modal.modalState.props || {},
    accountLabel: getCurrentAccountWithSendEtherInfo(state).name,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    disconnectAccount: (domainKey, domain) => {
      const permissionMethodNames = domain.permissions.map(perm => perm.parentCapability)
      dispatch(removePermissionsFor({ [domainKey]: permissionMethodNames }))
    },
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    domainKey,
    domain,
  } = stateProps
  const {
    disconnectAccount: dispatchDisconnectAccount,
  } = dispatchProps

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    disconnectAccount: () => dispatchDisconnectAccount(domainKey, domain),
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps, mergeProps)
)(DisconnectAccount)
