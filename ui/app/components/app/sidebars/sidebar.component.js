import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import WalletView from '../wallet-view'
import { WALLET_VIEW_SIDEBAR } from './sidebar.constants'
import CustomizeGas from '../gas-customization/gas-modal-page-container'

export default class Sidebar extends Component {

  static propTypes = {
    sidebarOpen: PropTypes.bool,
    hideSidebar: PropTypes.func,
    sidebarShouldClose: PropTypes.bool,
    transitionName: PropTypes.string,
    type: PropTypes.string,
    sidebarProps: PropTypes.object,
    onOverlayClose: PropTypes.func,
  }

  renderOverlay () {
    const { onOverlayClose } = this.props

    return (
      <div
        className="sidebar-overlay"
        onClick={() => {
          onOverlayClose && onOverlayClose()
          this.props.hideSidebar()
        }}
      />
    )
  }

  renderSidebarContent () {
    const { type, sidebarProps = {} } = this.props
    const { transaction = {} } = sidebarProps
    switch (type) {
      case WALLET_VIEW_SIDEBAR:
        return <WalletView responsiveDisplayClassname="sidebar-right" />
      case 'customize-gas':
        return <div className="sidebar-left"><CustomizeGas transaction={transaction} /></div>
      default:
        return null
    }

  }

  componentDidUpdate (prevProps) {
    if (!prevProps.sidebarShouldClose && this.props.sidebarShouldClose) {
      this.props.hideSidebar()
    }
  }

  render () {
    const { transitionName, sidebarOpen, sidebarShouldClose } = this.props

    return (
      <div>
        <TransitionGroup>
          <CSSTransition
            classNames={transitionName}
            timeout={{ enter: 300, leave: 200 }}
          >
            { sidebarOpen && !sidebarShouldClose ? this.renderSidebarContent() : null }
          </CSSTransition>
        </TransitionGroup>
        { sidebarOpen && !sidebarShouldClose ? this.renderOverlay() : null }
      </div>
    )
  }

}
