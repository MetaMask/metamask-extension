import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Tooltip from '../tooltip'
import SelectedAccount from '../selected-account'
import AccountDetailsDropdown from '../dropdowns/account-details-dropdown.js'

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

  state = { accountDetailsMenuOpen: false }

  render () {
    const { t } = this.context
    const { isMascara, sidebarOpen, hideSidebar, showSidebar } = this.props
    const { accountDetailsMenuOpen } = this.state

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
              title={t('accountOptions')}
              position="bottom"
            >
              <div
                className="fa fa-ellipsis-h fa-lg menu-bar__open-in-browser"
                onClick={() => this.setState({ accountDetailsMenuOpen: true })}
              >
              </div>
            </Tooltip>
          )
        }
        {
          accountDetailsMenuOpen && (
            <AccountDetailsDropdown
              className="menu-bar__account-details-dropdown" 
              onClose={() => this.setState({ accountDetailsMenuOpen: false })}
            />
          )
        }
      </div>
    )
  }
}
