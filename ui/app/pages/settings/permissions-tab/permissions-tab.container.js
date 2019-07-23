import PermissionsTab from './permissions-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  showModal,
  removePermissionsFor,
} from '../../../store/actions'
import {
  getAllPermissions, getPermissionsDescriptions,
} from '../../../selectors/selectors'

const mapStateToProps = state => {
  const { appState: { warning } } = state

  return {
    warning,
    permissions: getAllPermissions(state),
    permissionsDescriptions: getPermissionsDescriptions(state),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showClearPermissionsModal: () => dispatch(
      showModal({ name: 'CLEAR_PERMISSIONS' })
    ),
    removePermissionsFor: (domains) => dispatch(
      removePermissionsFor(domains)
    ),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(PermissionsTab)
