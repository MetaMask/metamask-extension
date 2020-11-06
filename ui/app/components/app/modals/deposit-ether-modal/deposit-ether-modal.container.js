import { connect } from 'react-redux'
import {
  buyEth,
  hideModal,
  showModal,
  hideWarning,
} from '../../../../store/actions'
import DepositEtherModal from './deposit-ether-modal.component'

function mapStateToProps(state) {
  return {
    network: state.metamask.network,
    address: state.metamask.selectedAddress,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    toWyre: (address) => {
      dispatch(buyEth({ service: 'wyre', address }))
    },
    toCoinSwitch: (address) => {
      dispatch(buyEth({ service: 'coinswitch', address }))
    },
    hideModal: () => {
      dispatch(hideModal())
    },
    hideWarning: () => {
      dispatch(hideWarning())
    },
    showAccountDetailModal: () => {
      dispatch(showModal({ name: 'ACCOUNT_DETAILS' }))
    },
    toFaucet: (network) => dispatch(buyEth({ network })),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DepositEtherModal)
