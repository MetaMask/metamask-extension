import { connect } from 'react-redux'
import TransactionListItemDetails from './transaction-list-item-details.component'
import { checksumAddress } from '../../../helpers/utils/util'
import { tryReverseResolveAddress } from '../../../store/actions'
import { getAddressBook, getRpcPrefsForCurrentProvider } from '../../../selectors'

const mapStateToProps = (state, ownProps) => {
  const { metamask } = state
  const {
    ensResolutionsByAddress,
  } = metamask
  const { recipientAddress, senderAddress } = ownProps
  const address = checksumAddress(recipientAddress)
  const recipientEns = ensResolutionsByAddress[address] || ''
  const addressBook = getAddressBook(state)

  const getNickName = (address) => {
    const entry = addressBook.find((contact) => {
      return address.toLowerCase() === contact.address.toLowerCase()
    })
    return (entry && entry.name) || ''
  }
  const rpcPrefs = getRpcPrefsForCurrentProvider(state)

  return {
    rpcPrefs,
    recipientEns,
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

export default connect(mapStateToProps, mapDispatchToProps)(TransactionListItemDetails)
