import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Tooltip from '../../ui/tooltip'
import SelectedAccount from '../selected-account'
import ConnectedStatusIndicator from '../connected-status-indicator'
import AccountDetailsDropdown from '../dropdowns/account-details-dropdown.js'

export default class MenuBar extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  state = { accountDetailsMenuOpen: false }

  render () {
    const { t } = this.context
    const { accountDetailsMenuOpen } = this.state

    return (
      <div className="menu-bar">
        <ConnectedStatusIndicator />

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
              onClose={() => this.setState({ accountDetailsMenuOpen: false })}
            />
          )
        }
      </div>
    )
  }
}
