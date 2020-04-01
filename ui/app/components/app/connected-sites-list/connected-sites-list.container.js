import { connect } from 'react-redux'
import ConnectedSitesList from './connected-sites-list.component'
import { getRenderablePermissionsDomains } from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  return {
    connectedDomains: getRenderablePermissionsDomains(state),
  }
}

export default connect(mapStateToProps)(ConnectedSitesList)
