import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import PluginView from './plugin-view.component'
import { getSelectedPluginUid, getSelectedPluginScript } from '../../selectors'


const mapStateToProps = state => {
  const { metamask: { network } } = state

  return {
    network,
    selectedPluginUid: getSelectedPluginUid(state),
    selectedPluginScript: getSelectedPluginScript(state),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(PluginView)
