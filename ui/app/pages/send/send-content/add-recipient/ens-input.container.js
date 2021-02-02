import EnsInput from './ens-input.component'
import {
  getCurrentNetwork,
  getSendTo,
  getSendToNickname,
  getSendToBase32,
  getSendToInputIsBase32,
} from '../../send.selectors'
import { getAddressBookEntry } from '../../../../selectors/selectors'
import { connect } from 'react-redux'

export default connect(state => {
  const selectedAddress = getSendTo(state)
  return {
    inputIsBase32: getSendToInputIsBase32(state),
    network: getCurrentNetwork(state),
    selectedAddress,
    selectedBase32Address: getSendToBase32(state),
    selectedName: getSendToNickname(state),
    contact: getAddressBookEntry(state, selectedAddress),
  }
})(EnsInput)
