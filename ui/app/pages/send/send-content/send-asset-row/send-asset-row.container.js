import { connect } from 'react-redux'
import SendAssetRow from './send-asset-row.component'
import { getMetaMaskAccounts } from '../../../../selectors/selectors'
import { setSelectedToken } from '../../../../store/actions'

function mapStateToProps (state) {
  return {
    tokens: state.metamask.tokens,
    selectedAddress: state.metamask.selectedAddress,
    selectedTokenAddress: state.metamask.selectedTokenAddress,
    accounts: getMetaMaskAccounts(state),
    nativeCurrency: state.metamask.nativeCurrency,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setSelectedToken: (address) => dispatch(setSelectedToken(address)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SendAssetRow)
