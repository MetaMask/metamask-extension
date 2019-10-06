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
  const namingResolution = getSendEnsResolution(state)

  let addressBookEntryName = ''
  if (namingResolution) {
    const addressBookEntry = getAddressBookEntry(state, namingResolution) || {}
    addressBookEntryName = addressBookEntry.name
  }

  const addressBook = getAddressBook(state)

  return {
    ownedAccounts: accountsWithSendEtherInfoSelector(state),
    addressBook,
    namingResolution,
    addressBookEntryName,
    ensResolutionError: getSendEnsResolutionError(state),
    contacts: addressBook.filter(({ name }) => !!name),
    nonContacts: addressBook.filter(({ name }) => !name),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
  }
}
