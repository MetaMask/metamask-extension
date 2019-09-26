import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Tooltip from '../../ui/tooltip'
import SelectedAccount from '../selected-account'
import AccountDetailsDropdown from '../dropdowns/account-details-dropdown.js'

export default class MenuBar extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    hideSidebar: PropTypes.func,
    sidebarOpen: PropTypes.bool,
    showSidebar: PropTypes.func,
  }

  state = { accountDetailsMenuOpen: false }

  render () {
    const { t } = this.context
    const { sidebarOpen, hideSidebar, showSidebar } = this.props
    const { accountDetailsMenuOpen } = this.state

    return (
      <div className="menu-bar">
        <Tooltip
          title={t('menu')}
          position="bottom"
        >
          <div
            className="menu-bar__sidebar-button"
            onClick={() => {
              this.context.metricsEvent({
                eventOpts: {
                  category: 'Navigation',
                  action: 'Home',
                  name: 'Opened Hamburger',
                },
              })
              sidebarOpen ? hideSidebar() : showSidebar()
            }}
          />
        </Tooltip>
        <SelectedAccount />

        <Tooltip
          title={t('accountOptions')}
          position="bottom"
        >
          <div
            className="menu-bar__open-in-browser"
            onClick={() => {
              this.context.metricsEvent({
                eventOpts: {
                  category: 'Navigation',
                  action: 'Home',
                  name: 'Opened Account Options',
                },
              })
              this.setState({ accountDetailsMenuOpen: true })
            }}
          >
          </div>
        </Tooltip>

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
