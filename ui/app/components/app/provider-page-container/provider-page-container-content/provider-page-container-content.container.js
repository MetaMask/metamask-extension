import { connect } from 'react-redux'
import ProviderPageContainerContent from './provider-page-container-content.component'
import { getSelectedIdentity } from '../../../../selectors/selectors'

const mapStateToProps = (state) => {
  return {
    selectedIdentity: getSelectedIdentity(state),
  }
}

export default connect(mapStateToProps)(ProviderPageContainerContent)
