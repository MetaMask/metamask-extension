import ContactListTab from './contact-list-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBook } from '../../../selectors/selectors'

const mapStateToProps = state => {
  return {
    addressBook: getAddressBook(state),
    network: state.metamask.network,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(ContactListTab)
