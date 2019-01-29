import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import PluginView from './plugin-view.component'
import { getSelectedToken, getSelectedAddress, getSelectedTokenAssetImage, getSelectedPluginAddress, getSelectedPluginScript } from '../../selectors'
import { showModal } from '../../actions'


const mapStateToProps = state => {
  const selectedAddress = getSelectedAddress(state)
  const { metamask: { network, accounts } } = state
  const account = accounts[selectedAddress]
  const { balance } = account

  return {
    network,
    balance,
    assetImage: getSelectedTokenAssetImage(state),
    selectedPluginAddress: getSelectedPluginAddress(state),
    selectedPluginScript: getSelectedPluginScript(state),
  }
}

// const mapDispatchToProps = dispatch => {
//   return {
//     showDepositModal: () => dispatch(showModal({ name: 'DEPOSIT_ETHER' })),
//   }
// }

//connect(mapStateToProps, mapDispatchToProps)

export default compose(
  withRouter,
  connect(mapStateToProps)
)(PluginView)
