import {
    getSendFrom,
    conversionRateSelector,
    getSelectedTokenContract,
    getCurrentAccountWithSendEtherInfo,
    accountsWithSendEtherInfoSelector,
} from '../../send.selectors.js'
import { getFromDropdownOpen } from './send-from-row.selectors.js'
import { calcTokenUpdateAmount } from './send-from-row.utils.js'
import {
    updateSendTokenBalance,
    updateSendFrom,
} from '../../../actions'
import {
    openFromDropdown,
    closeFromDropdown,
} from '../../../ducks/send'
import SendFromRow from './send-from-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendFromRow)

function mapStateToProps (state) {
  return {
    from: getSendFrom(state) || getCurrentAccountWithSendEtherInfo(state),
    fromAccounts: accountsWithSendEtherInfoSelector(state),
    conversionRate: conversionRateSelector(state),
    fromDropdownOpen: getFromDropdownOpen(state),
    tokenContract: getSelectedTokenContract(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateSendTokenBalance: (usersToken, selectedToken) => {
        if (!usersToken) return

        const tokenBalance = calcTokenUpdateAmount(selectedToken, selectedToken)
        dispatch(updateSendTokenBalance(tokenBalance))
    },
    updateSendFrom: newFrom => dispatch(updateSendFrom(newFrom)),
    openFromDropdown: () => dispatch(()),
    closeFromDropdown: () => dispatch(()),
  }
}
