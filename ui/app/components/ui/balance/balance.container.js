import { connect } from 'react-redux'
import Balance from './balance.component'
import {
  getMetaMaskAccounts,
  getIsMainnet,
  preferencesSelector,
} from '../../../selectors'

const mapStateToProps = (state) => {
  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)
  const accounts = getMetaMaskAccounts(state)
  const selectedAddress = state.metamask.selectedAddress || Object.keys(accounts)[0]
  const account = accounts[selectedAddress]

  return {
    account,
    showFiat: (isMainnet || !!showFiatInTestnets),
  }
}

export default connect(mapStateToProps)(Balance)
