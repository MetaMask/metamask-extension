import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Tooltip from '../tooltip'
import SelectedAccount from '../selected-account'

export default class MenuBar extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    hideSidebar: PropTypes.func,
    isMascara: PropTypes.bool,
    sidebarOpen: PropTypes.bool,
    showSidebar: PropTypes.func,
  }

  render () {
    const { t } = this.context
    const { isMascara, sidebarOpen, hideSidebar, showSidebar } = this.props

    return (
      <div className="menu-bar">
        <Tooltip
          title={t('menu')}
          position="bottom"
        >
          <div
            className="fa fa-bars menu-bar__sidebar-button"
            onClick={() => sidebarOpen ? hideSidebar() : showSidebar()}
          />
        </Tooltip>
        <SelectedAccount />
        {
          !isMascara && (
            <Tooltip
              title={t('openInTab')}
              position="bottom"
            >
              <div
                className="menu-bar__open-in-browser"
                onClick={() => global.platform.openExtensionInBrowser()}
              >
                <img src="images/popout.svg" />
              </div>
            </Tooltip>
          )
        }
      </div>
    )
  }
}
