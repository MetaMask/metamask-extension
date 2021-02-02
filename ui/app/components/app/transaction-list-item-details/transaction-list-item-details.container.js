import { connect } from 'react-redux'
import TransactionListItemDetails from './transaction-list-item-details.component'
import { getAddressBook } from '../../../selectors/selectors'

const mapStateToProps = (state, ownProps) => {
  const { recipientAddress, senderAddress } = ownProps
  const addressBook = getAddressBook(state)

  const getNickName = address => {
    const entry = addressBook.find(contact => {
      return address && address.toLowerCase() === contact.address.toLowerCase()
    })
    return (entry && entry.name) || ''
  }

  return {
    senderNickname: getNickName(senderAddress),
    recipientNickname: getNickName(recipientAddress),
  }
}

export default connect(mapStateToProps)(TransactionListItemDetails)
