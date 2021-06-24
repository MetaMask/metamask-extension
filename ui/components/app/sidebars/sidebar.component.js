import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactCSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import CustomizeGas from '../gas-customization/gas-modal-page-container';
import { MILLISECOND } from '../../../../shared/constants/time';

import EditGasPopover from '../edit-gas-popover/edit-gas-popover.component';

export default class Sidebar extends Component {
  static propTypes = {
    sidebarOpen: PropTypes.bool,
    hideSidebar: PropTypes.func,
    sidebarShouldClose: PropTypes.bool,
    transitionName: PropTypes.string,
    type: PropTypes.string,
    sidebarProps: PropTypes.object,
    onOverlayClose: PropTypes.func,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  renderOverlay() {
    const { onOverlayClose } = this.props;

    return (
      <div
        className="sidebar-overlay"
        onClick={() => {
          onOverlayClose?.();
          this.props.hideSidebar();
        }}
      />
    );
  }

  renderSidebarContent() {
    const { type, sidebarProps = {} } = this.props;
    const { transaction = {}, onSubmit, hideBasic } = sidebarProps;
    switch (type) {
      case 'customize-gas':
        return (
          <div className="sidebar-left">
            <CustomizeGas
              transaction={transaction}
              onSubmit={onSubmit}
              hideBasic={hideBasic}
            />
          </div>
        );
      default:
        return null;
    }
  }

  renderGasPopover() {
    const { t } = this.context;

    return (
      <EditGasPopover
        popoverTitle={t('speedUpPopoverTitle')}
        editGasDisplayProps={{ alwaysShowForm: true, type: 'speed-up' }}
        confirmButtonText={t('submit')}
      />
    );
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.sidebarShouldClose && this.props.sidebarShouldClose) {
      this.props.hideSidebar();
    }
  }

  render() {
    const { transitionName, sidebarOpen, sidebarShouldClose } = this.props;

    const showSidebar = sidebarOpen && !sidebarShouldClose;

    if (showSidebar && process.env.SHOW_EIP_1559_UI) {
      return this.renderGasPopover();
    }

    return (
      <div>
        <ReactCSSTransitionGroup
          transitionName={transitionName}
          transitionEnterTimeout={MILLISECOND * 300}
          transitionLeaveTimeout={MILLISECOND * 200}
        >
          {showSidebar ? this.renderSidebarContent() : null}
        </ReactCSSTransitionGroup>
        {showSidebar ? this.renderOverlay() : null}
      </div>
    );
  }
}
