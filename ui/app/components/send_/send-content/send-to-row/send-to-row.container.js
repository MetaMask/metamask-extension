import { connect } from 'react-redux'
import {
    getSendTo,
    getToAccounts,
    getCurrentNetwork,
    getSendToAccounts,
} from '../../send.selectors.js'
import {
    getToDropdownOpen,
    sendToIsInError,
} from './send-to-row.selectors.js'
import { getToErrorObject } from './send-to-row.utils.js'
import {
    updateSendErrors,
    updateSendTo,
} from '../../../../actions'
import {
    openToDropdown,
    closeToDropdown,
} from '../../../../ducks/send'
import SendToRow from './send-to-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendToRow)

function mapStateToProps (state) {
  updateSendTo
  return {
    to: getSendTo(state),
    toAccounts: getSendToAccounts(state),
    toDropdownOpen: getToDropdownOpen(state),
    inError: sendToIsInError(state),
    network: getCurrentNetwork(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateSendToError: (to) => {
        dispatch(updateSendErrors(getToErrorObject(to)))
    },
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
    openToDropdown: () => dispatch(openToDropdown()),
    closeToDropdown: () => dispatch(closeToDropdown()),
  }
}