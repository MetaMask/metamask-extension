import ShortCutsTab from './shortcuts-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  setShortCutRoute,
  setExtensionShortcuts,
} from '../../../store/actions'

const mapStateToProps = state => {
  const {
    metamask: { shortCutRoutes = {} },
    appState: { extensionShortcuts = [] },
  } = state

  return {
    shortCutRoutes,
    extensionShortcuts,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setShortCutRoute: (shortCutKey, route) => dispatch(setShortCutRoute(shortCutKey, route)),
    setExtensionShortcuts: () => dispatch(setExtensionShortcuts()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ShortCutsTab)
