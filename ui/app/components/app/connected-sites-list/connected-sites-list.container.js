import { connect } from 'react-redux'
import { compose } from 'recompose'

import ConnectedSitesList from './connected-sites-list.component'
import {
  removePermissionsFor,
  showModal,
  clearPermissions,
} from '../../../store/actions'
import {
  getRenderablePermissionsDomains,
  getPermissionsDomains,
} from '../../../selectors/selectors'

const mapStateToProps = state => {
  return {
    domains: getPermissionsDomains(state),
    renderableDomains: getRenderablePermissionsDomains(state),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showDisconnectAccountModal: (domainKey, domain) => {
      dispatch(showModal({ name: 'DISCONNECT_ACCOUNT' , domainKey, domain }))
    },
    showDisconnectAllModal: () => {
      dispatch(showModal({ name: 'DISCONNECT_ALL' }))
    },
  }
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps)
)(ConnectedSitesList)
