import EnsInput from './ens-input.component'
import {
  getCurrentNetwork,
  getSendTo,
  getSendToNickname,
} from '../../send.selectors'
import {
  getAddressBook,
} from '../../../../selectors/selectors'
const connect = require('react-redux').connect


export default connect(
  state => ({
    network: getCurrentNetwork(state),
    selectedAddress: getSendTo(state),
    selectedName: getSendToNickname(state),
    addressBook: getAddressBook(state),
  })
)(EnsInput)
