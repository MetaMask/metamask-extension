import { connect } from 'react-redux'
import {
    accountsWithSendEtherInfoSelector,
    getAddressBook,
} from '../../send.selectors.js'
import {
  getSendEnsResolution,
  getSendEnsResolutionError,
} from '../../../send/send.selectors';
import {
    updateSendTo,
} from '../../../../store/actions'
import AddRecipient from './add-recipient.component'

export default connect(mapStateToProps, mapDispatchToProps)(AddRecipient)

function mapStateToProps (state) {
  return {
    ownedAccounts: accountsWithSendEtherInfoSelector(state),
    addressBook: getAddressBook(state),
    ensResolution: getSendEnsResolution(state),
    ensResolutionError: getSendEnsResolutionError(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
  }
}
