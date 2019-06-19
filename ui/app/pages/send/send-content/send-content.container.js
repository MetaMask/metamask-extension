import { connect } from 'react-redux'
import SendContent from './send-content.component'
import {
  accountsWithSendEtherInfoSelector,
  getAddressBook,
  getSendTo,
} from '../send.selectors'
import actions from '../../../store/actions'

function mapStateToProps (state) {
  return {
    to: getSendTo(state),
    addressBook: getAddressBook(state),
    ownedAccounts: accountsWithSendEtherInfoSelector(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showAddToAddressBookModal: () => dispatch(actions.showModal({
      name: 'ADD_TO_ADDRESSBOOK',
    })),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SendContent)
