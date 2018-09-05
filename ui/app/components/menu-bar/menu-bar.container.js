import { connect } from 'react-redux'
import MenuBar from './menu-bar.component'
import { showSidebar, hideSidebar } from '../../actions'

const mapStateToProps = state => {
  const { appState: { sidebar: { isOpen }, isMascara } } = state

  return {
    sidebarOpen: isOpen,
    isMascara,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showSidebar: () => {
      dispatch(showSidebar({
        transitionName: 'sidebar-right',
        type: 'wallet-view',
      }))
    },
    hideSidebar: () => dispatch(hideSidebar()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MenuBar)
