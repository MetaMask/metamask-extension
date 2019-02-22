import { connect } from 'react-redux'
import ProviderPageContainerContent from './provider-page-container-content.component'
import { getSelectedIdentity, getPermissionsDescriptions } from '../../../selectors'

const mapStateToProps = (state) => {
  return {
    selectedIdentity: getSelectedIdentity(state),
    permissionsDescriptions: getPermissionsDescriptions(state),
  }
}

export default connect(mapStateToProps)(ProviderPageContainerContent)
