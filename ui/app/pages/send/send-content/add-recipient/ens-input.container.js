import EnsInput from './ens-input.component'
import {
  getCurrentNetwork,
  getSendTo,
  getSendToNickname,
} from '../../send.selectors'
import {
  getAddressBookEntry,
} from '../../../../selectors/selectors'
const connect = require('react-redux').connect


export default connect(
  state => {
    const selectedAddress = getSendTo(state)
    return {
      network: getCurrentNetwork(state),
      selectedAddress,
      selectedName: getSendToNickname(state),
      contact: getAddressBookEntry(state, selectedAddress),
    }
  }
)(EnsInput)
