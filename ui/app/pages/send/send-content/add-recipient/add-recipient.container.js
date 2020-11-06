import { connect } from 'react-redux'
import {
  getSendEnsResolution,
  getSendEnsResolutionError,
  accountsWithSendEtherInfoSelector,
  getAddressBook,
  getAddressBookEntry,
} from '../../../../selectors'

import { updateSendTo } from '../../../../store/actions'
import AddRecipient from './add-recipient.component'

export default connect(mapStateToProps, mapDispatchToProps)(AddRecipient)

function mapStateToProps(state) {
  const ensResolution = getSendEnsResolution(state)

  let addressBookEntryName = ''
  if (ensResolution) {
    const addressBookEntry = getAddressBookEntry(state, ensResolution) || {}
    addressBookEntryName = addressBookEntry.name
  }

  const addressBook = getAddressBook(state)

  return {
    ownedAccounts: accountsWithSendEtherInfoSelector(state),
    addressBook,
    ensResolution,
    addressBookEntryName,
    ensResolutionError: getSendEnsResolutionError(state),
    contacts: addressBook.filter(({ name }) => Boolean(name)),
    nonContacts: addressBook.filter(({ name }) => !name),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
  }
}
