import { connect } from 'react-redux'
import {
  getSendTo,
  accountsWithSendEtherInfoSelector,
  getAddressBookEntry,
} from '../../../selectors'

import * as actions from '../../../store/actions'
import SendContent from './send-content.component'

function mapStateToProps(state) {
  const ownedAccounts = accountsWithSendEtherInfoSelector(state)
  const to = getSendTo(state)
  return {
    isOwnedAccount: Boolean(
      ownedAccounts.find(
        ({ address }) => address.toLowerCase() === to.toLowerCase(),
      ),
    ),
    contact: getAddressBookEntry(state, to),
    to,
    isUserVerifiedByCaptcha: state.metamask.isUserVerifiedByCaptcha,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    showAddToAddressBookModal: (recipient) =>
      dispatch(
        actions.showModal({
          name: 'ADD_TO_ADDRESSBOOK',
          recipient,
        }),
      ),
    updateSendIsHcaptchaVerified: (value) =>
      dispatch(actions.updateSendIsHcaptchaVerified(value)),
  }
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const { to } = stateProps
  return {
    ...ownProps,
    ...stateProps,
    showAddToAddressBookModal: () =>
      dispatchProps.showAddToAddressBookModal(to),
    updateSendIsHcaptchaVerified: (value) =>
      dispatchProps.updateSendIsHcaptchaVerified(value),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(SendContent)
