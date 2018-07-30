import { connect } from 'react-redux'
import MenuBar from './menu-bar.component'
import { showSidebar, hideSidebar } from '../../actions'

const mapStateToProps = state => {
  const { appState: { sidebarOpen, isMascara } } = state

  return {
    sidebarOpen,
    isMascara,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showSidebar: () => dispatch(showSidebar()),
    hideSidebar: () => dispatch(hideSidebar()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MenuBar)
