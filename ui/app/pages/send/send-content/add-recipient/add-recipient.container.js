import { connect } from 'react-redux'
import {
  accountsWithSendEtherInfoSelector,
  getSendEnsResolution,
  getSendEnsResolutionError,
} from '../../send.selectors.js'
import {
  getAddressBook,
  getAddressBookEntry,
} from '../../../../selectors/selectors'
import {
  updateSendTo,
} from '../../../../store/actions'
import AddRecipient from './add-recipient.component'

export default connect(mapStateToProps, mapDispatchToProps)(AddRecipient)

function mapStateToProps (state) {
  const ensResolution = getSendEnsResolution(state)

  let addressBookEntryName = ''
  if (ensResolution) {
    const addressBookEntry = getAddressBookEntry(state, ensResolution) || {}
    addressBookEntryName = addressBookEntry.name
  }

  return {
    ownedAccounts: accountsWithSendEtherInfoSelector(state),
    addressBook: getAddressBook(state),
    ensResolution,
    addressBookEntryName,
    ensResolutionError: getSendEnsResolutionError(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
  }
}
