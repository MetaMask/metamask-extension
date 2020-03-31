import { connect } from 'react-redux'
import ConnectedSitesList from './connected-sites-list.component'
import { getOpenMetamaskTabsIds } from '../../../store/actions'
import { getRenderablePermissionsDomains } from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  return {
    connectedDomains: getRenderablePermissionsDomains(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    getOpenMetamaskTabsIds: () => dispatch(getOpenMetamaskTabsIds()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedSitesList)
