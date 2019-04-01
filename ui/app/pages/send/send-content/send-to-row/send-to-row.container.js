import { connect } from 'react-redux'
import {
    getCurrentNetwork,
    getSelectedToken,
    getSendTo,
    getSendToAccounts,
    getSendHexData,
} from '../../send.selectors.js'
import {
    getToDropdownOpen,
    getTokens,
    sendToIsInError,
    sendToIsInWarning,
} from './send-to-row.selectors.js'
import {
    updateSendTo,
} from '../../../../store/actions'
import {
  updateSendErrors,
  updateSendWarnings,
  openToDropdown,
  closeToDropdown,
} from '../../../../ducks/send/send.duck'
import SendToRow from './send-to-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendToRow)

function mapStateToProps (state) {
  return {
    hasHexData: Boolean(getSendHexData(state)),
    inError: sendToIsInError(state),
    inWarning: sendToIsInWarning(state),
    network: getCurrentNetwork(state),
    selectedToken: getSelectedToken(state),
    to: getSendTo(state),
    toAccounts: getSendToAccounts(state),
    toDropdownOpen: getToDropdownOpen(state),
    tokens: getTokens(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    closeToDropdown: () => dispatch(closeToDropdown()),
    openToDropdown: () => dispatch(openToDropdown()),
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
    updateSendToError: (toErrorObject) => {
        dispatch(updateSendErrors(toErrorObject))
    },
    updateSendToWarning: (toWarningObject) => {
      dispatch(updateSendWarnings(toWarningObject))
  },
  }
}
