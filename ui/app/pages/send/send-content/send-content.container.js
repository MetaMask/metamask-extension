import { connect } from 'react-redux'
import SendContent from './send-content.component'
import {
  accountsWithSendEtherInfoSelector,
  getAddressBook,
  getSendTo,
} from '../send.selectors'

function mapStateToProps (state) {
  return {
    to: getSendTo(state),
    addressBook: getAddressBook(state),
    ownedAccounts: accountsWithSendEtherInfoSelector(state),
  }
}

export default connect(mapStateToProps)(SendContent)
