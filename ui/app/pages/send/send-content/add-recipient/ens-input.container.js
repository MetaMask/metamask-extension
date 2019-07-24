import EnsInput from './ens-input.component'
import {
  getCurrentNetwork,
  getSendTo,
  getSendToNickname
} from '../../send.selectors'
import {
  getAddressBook,
} from '../../../../selectors/selectors'
import {
  updateSendTo,
  updateEnsResolution,
  updateEnsResolutionError,
} from '../../../../store/actions'
const connect = require('react-redux').connect


export default connect(
  state => ({
    network: getCurrentNetwork(state),
    selectedAddress: getSendTo(state),
    selectedName: getSendToNickname(state),
    addressBook: getAddressBook(state),
  }),
  dispatch => ({
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
    updateEnsResolution: (ensResolution) => dispatch(updateEnsResolution(ensResolution)),
    updateEnsResolutionError: (message) => dispatch(updateEnsResolutionError(message)),
  })
)(EnsInput)
