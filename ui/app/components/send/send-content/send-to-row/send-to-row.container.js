import { connect } from 'react-redux'
import {
    getCurrentNetwork,
    getSendTo,
    getSendToAccounts,
} from '../../send.selectors.js'
import {
    getToDropdownOpen,
    sendToIsInError,
} from './send-to-row.selectors.js'
import {
    updateSendTo,
} from '../../../../actions'
import {
  updateSendErrors,
  openToDropdown,
  closeToDropdown,
} from '../../../../ducks/send.duck'
import SendToRow from './send-to-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendToRow)

function mapStateToProps (state) {
  return {
    inError: sendToIsInError(state),
    network: getCurrentNetwork(state),
    to: getSendTo(state),
    toAccounts: getSendToAccounts(state),
    toDropdownOpen: getToDropdownOpen(state),
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
  }
}
