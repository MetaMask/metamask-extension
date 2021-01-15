import { connect } from 'react-redux'
import SendContent from './send-content.component'
import {
  accountsWithSendEtherInfoSelector,
  getSendTo,
  getSendToBase32,
  getAddressTransactionCount,
  getSendToInputIsBase32,
} from '../send.selectors'
import { getAddressBookEntry } from '../../../selectors/selectors'
import * as actions from '../../../store/actions'

function mapStateToProps(state) {
  const toTransactionCount = getAddressTransactionCount(state)
  const ownedAccounts = accountsWithSendEtherInfoSelector(state)
  const to = getSendTo(state)
  const inputIsBase32 = getSendToInputIsBase32(state)
  const base32To = getSendToBase32(state)
  return {
    inputIsBase32,
    base32To,
    to,
    toTransactionCount,
    isOwnedAccount: !!ownedAccounts.find(
      ({ address }) => address.toLowerCase() === to.toLowerCase()
    ),
    contact: getAddressBookEntry(state, to),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchAddressTransactionCount: () =>
      dispatch(actions.fetchAddressTransactionCount()),
    showAddToAddressBookModal: recipient =>
      dispatch(
        actions.showModal({
          name: 'ADD_TO_ADDRESSBOOK',
          recipient,
        })
      ),
  }
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const { to, ...restStateProps } = stateProps
  return {
    ...ownProps,
    ...restStateProps,
    ...dispatchProps,
    showAddToAddressBookModal: () =>
      dispatchProps.showAddToAddressBookModal(to),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(SendContent)
