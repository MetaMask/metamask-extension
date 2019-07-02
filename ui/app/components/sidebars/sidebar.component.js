import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { CSSTransitionGroup } from 'react-transition-group'
import WalletView from '../wallet-view'
import { WALLET_VIEW_SIDEBAR } from './sidebar.constants'

export default class Sidebar extends Component {

  static propTypes = {
    sidebarOpen: PropTypes.bool,
    hideSidebar: PropTypes.func,
    transitionName: PropTypes.string,
    type: PropTypes.string,
  };

  renderOverlay () {
    return <div className="sidebar-overlay" onClick={() => this.props.hideSidebar()} />
  }

  renderSidebarContent () {
    const { type } = this.props

    switch (type) {
      case WALLET_VIEW_SIDEBAR:
        return <WalletView responsiveDisplayClassname={'sidebar-right' } />
      default:
        return null
    }

  }

  render () {
    const { transitionName, sidebarOpen } = this.props

    return (
      <div>
        <CSSTransitionGroup
          transitionName={transitionName}
          transitionEnterTimeout={300}
          transitionLeaveTimeout={200}
        >
          { sidebarOpen ? this.renderSidebarContent() : null }
        </CSSTransitionGroup>
        { sidebarOpen ? this.renderOverlay() : null }
      </div>
    )
  }

}
