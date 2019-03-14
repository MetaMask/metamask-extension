import { connect } from 'react-redux'
import { WALLET_VIEW_SIDEBAR } from '../sidebars/sidebar.constants'
import MenuBar from './menu-bar.component'
import { showSidebar, hideSidebar } from '../../../store/actions'

const mapStateToProps = state => {
  const { appState: { sidebar: { isOpen } } } = state

  return {
    sidebarOpen: isOpen,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showSidebar: () => {
      dispatch(showSidebar({
        transitionName: 'sidebar-right',
        type: WALLET_VIEW_SIDEBAR,
      }))
    },
    hideSidebar: () => dispatch(hideSidebar()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MenuBar)
