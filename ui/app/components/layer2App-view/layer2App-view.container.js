import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import Layer2AppView from './layer2App-view.component'
import { getSelectedToken, getSelectedAddress, getSelectedTokenAssetImage } from '../../selectors'
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
