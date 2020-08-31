import { connect } from 'react-redux'
import TransactionListItemDetails from './transaction-list-item-details.component'
import { tryReverseResolveAddress } from '../../../store/actions'
import { getAddressBook } from '../../../selectors/selectors'

const mapStateToProps = (state, ownProps) => {
  const { recipientAddress, senderAddress } = ownProps
  const addressBook = getAddressBook(state)

  const getNickName = (address) => {
    const entry = addressBook.find((contact) => {
      return address && address.toLowerCase() === contact.address.toLowerCase()
    })
    return (entry && entry.name) || ''
  }

  return {
    senderNickname: getNickName(senderAddress),
    recipientNickname: getNickName(recipientAddress),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    tryReverseResolveAddress: (address) => {
      return dispatch(tryReverseResolveAddress(address))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TransactionListItemDetails)
