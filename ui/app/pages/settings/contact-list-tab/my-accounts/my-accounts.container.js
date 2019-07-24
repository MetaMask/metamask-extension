import ViewContact from './my-accounts.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { accountsWithSendEtherInfoSelector } from '../../../../selectors/selectors'

const mapStateToProps = (state,) => {
  const myAccounts = accountsWithSendEtherInfoSelector(state)

  return {
    myAccounts,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(ViewContact)
