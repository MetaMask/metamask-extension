import PluginsTab from './plugins-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  showModal,
  removePlugins,
} from '../../../store/actions'
import {
  getAllPlugins,
} from '../../../selectors/selectors'

const mapStateToProps = state => {
  const { appState: { warning } } = state

  return {
    warning,
    plugins: getAllPlugins(state),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showClearPluginsModal: () => dispatch(
      showModal({ name: 'CLEAR_PLUGINS' })
    ),
    removePlugins: (pluginNames) => dispatch(
      removePlugins(pluginNames)
    ),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(PluginsTab)
