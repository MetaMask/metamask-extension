import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Tooltip from '../../ui/tooltip'
import SelectedAccount from '../selected-account'
import ConnectedStatusIndicator from '../connected-status-indicator'
import AccountDetailsDropdown from '../dropdowns/account-details-dropdown'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../app/scripts/lib/enums'
import { CONNECTED_ACCOUNTS_ROUTE } from '../../../helpers/constants/routes'

export default class MenuBar extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  state = { accountDetailsMenuOpen: false }

  render () {
    const { history } = this.props
    const { t } = this.context
    const { accountDetailsMenuOpen } = this.state

    return (
      <div className="menu-bar">
        {
          getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
            ? <ConnectedStatusIndicator onClick={() => history.push(CONNECTED_ACCOUNTS_ROUTE)} />
            : null
        }

        <SelectedAccount />

        <Tooltip title={t('accountOptions')} position="left">
          <button
            className="fas fa-ellipsis-v menu-bar__account-options"
            title={t('accountOptions')}
            onClick={() => {
              this.context.metricsEvent({
                eventOpts: {
                  category: 'Navigation',
                  action: 'Home',
                  name: 'Opened Account Options',
                },
              })
              this.setState((prevState) => ({
                accountDetailsMenuOpen: !prevState.accountDetailsMenuOpen,
              }))
            }}
          >
          </button>
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
