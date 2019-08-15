import { connect } from 'react-redux'
import SendContent from './send-content.component'
import {
  accountsWithSendEtherInfoSelector,
  getSendTo,
} from '../send.selectors'
import {
  getAddressBookEntry,
} from '../../../selectors/selectors'
import actions from '../../../store/actions'

function mapStateToProps (state) {
  const ownedAccounts = accountsWithSendEtherInfoSelector(state)
  const to = getSendTo(state)
  return {
    isOwnedAccount: !!ownedAccounts.find(({ address }) => address.toLowerCase() === to.toLowerCase()),
    contact: getAddressBookEntry(state, to),
    to,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showAddToAddressBookModal: (recipient) => dispatch(actions.showModal({
      name: 'ADD_TO_ADDRESSBOOK',
      recipient,
    })),
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    showAddToAddressBookModal: () => dispatchProps.showAddToAddressBookModal(stateProps.to),
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(SendContent)
