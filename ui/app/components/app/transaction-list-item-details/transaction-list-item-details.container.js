import { connect } from 'react-redux'
import TransactionListItemDetails from './transaction-list-item-details.component'
import { checksumAddress } from '../../../helpers/utils/util'
import { tryReverseResolveAddress } from '../../../store/actions'

const mapStateToProps = (state, ownProps) => {
  const { metamask } = state
  const {
    ensResolutionsByAddress,
  } = metamask
  const { recipientAddress } = ownProps
  const address = checksumAddress(recipientAddress)
  const recipientEns = ensResolutionsByAddress[address] || ''

  return {
    recipientEns,
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
