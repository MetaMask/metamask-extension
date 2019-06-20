import { connect } from 'react-redux'
import {
    getCurrentNetwork,
    getSelectedToken,
    getSendTo,
    getSendToAccounts,
    getSendHexData,
    accountsWithSendEtherInfoSelector,
    getAddressBook,
} from '../../send.selectors.js'
import {
    getToDropdownOpen,
    getTokens,
    sendToIsInError,
    sendToIsInWarning,
} from './add-recipient.selectors.js'
import {
    updateSendTo,
} from '../../../../store/actions'
import {
  updateSendErrors,
  updateSendWarnings,
  openToDropdown,
  closeToDropdown,
} from '../../../../ducks/send/send.duck'
import AddRecipient from './add-recipient.component'

export default connect(mapStateToProps, mapDispatchToProps)(AddRecipient)

function mapStateToProps (state) {
  return {
    // hasHexData: Boolean(getSendHexData(state)),
    // inError: sendToIsInError(state),
    // inWarning: sendToIsInWarning(state),
    // network: getCurrentNetwork(state),
    // to: getSendTo(state),
    // toAccounts: getSendToAccounts(state),
    // selectedToken: getSelectedToken(state),
    // toDropdownOpen: getToDropdownOpen(state),
    // tokens: getTokens(state),
    ownedAccounts: accountsWithSendEtherInfoSelector(state),
    addressBook: getAddressBook(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    // closeToDropdown: () => dispatch(closeToDropdown()),
    // openToDropdown: () => dispatch(openToDropdown()),
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
    // updateSendToError: (toErrorObject) => {
    //     dispatch(updateSendErrors(toErrorObject))
    // },
    // updateSendToWarning: (toWarningObject) => {
    //   dispatch(updateSendWarnings(toWarningObject))
    // },
  }
}
