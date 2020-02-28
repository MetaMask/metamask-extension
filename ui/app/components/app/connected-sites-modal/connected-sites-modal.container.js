import { connect } from 'react-redux'
import ConnectedSitesModal from './connected-sites-modal.component'
import {
  getRenderablePermissionsDomains,
} from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  return {
    connectedSites: getRenderablePermissionsDomains(state),
  }
}

const mapDispatchToProps = () => {
  return {
    onDisconnectSite (key) {
      console.log(`Disconnect ${key}`)
    },

    onGoToSite (key) {
      console.log(`Go to ${key}`)
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedSitesModal)
