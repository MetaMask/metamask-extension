import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import Layer2AppView from './layer2App-view.component'
import { getSelectedToken, getSelectedAddress, getSelectedTokenAssetImage, getSelectedLayer2AppAddress, getSelectedLayer2AppScript } from '../../selectors'
import { showModal } from '../../actions'






const mapStateToProps = state => {
  const selectedAddress = getSelectedAddress(state)
  const { metamask: { network, accounts } } = state
  const account = accounts[selectedAddress]
  const { balance } = account

  return {
    selectedToken: getSelectedToken(state),
    network,
    balance,
    assetImage: getSelectedTokenAssetImage(state),
    selectedLayer2AppAddress: getSelectedLayer2AppAddress(state),
    selectedLayer2AppScript: getSelectedLayer2AppScript(state),
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
)(Layer2AppView)
