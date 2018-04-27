import { connect } from 'react-redux'
import {
    accountsWithSendEtherInfoSelector,
    getConversionRate,
    getSelectedTokenContract,
    getSendFromObject,
} from '../../send.selectors.js'
import {
  getFromDropdownOpen,
} from './send-from-row.selectors.js'
import { calcTokenUpdateAmount } from './send-from-row.utils.js'
import {
    updateSendFrom,
    updateSendTokenBalance,
} from '../../../../actions'
import {
    closeFromDropdown,
    openFromDropdown,
} from '../../../../ducks/send'
import SendFromRow from './send-from-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendFromRow)

function mapStateToProps (state) {
  return {
    conversionRate: getConversionRate(state),
    from: getSendFromObject(state),
    fromAccounts: accountsWithSendEtherInfoSelector(state),
    fromDropdownOpen: getFromDropdownOpen(state),
    tokenContract: getSelectedTokenContract(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    closeFromDropdown: () => dispatch(closeFromDropdown()),
    openFromDropdown: () => dispatch(openFromDropdown()),
    updateSendFrom: newFrom => dispatch(updateSendFrom(newFrom)),
    updateSendTokenBalance: (usersToken, selectedToken) => {
        if (!usersToken) return

        const tokenBalance = calcTokenUpdateAmount(selectedToken, selectedToken)
        dispatch(updateSendTokenBalance(tokenBalance))
    },
  }
}
