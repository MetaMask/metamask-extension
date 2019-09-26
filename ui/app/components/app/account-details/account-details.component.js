import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Identicon from '../../ui/identicon'
import Tooltip from '../../ui/tooltip-v2'
import copyToClipboard from 'copy-to-clipboard'

export default class AccountDetails extends Component {
  static contextTypes = {
    t: PropTypes.func.isRequired,
    metricsEvent: PropTypes.func,
  }

  static defaultProps = {
    hideSidebar: () => {},
    showAccountDetailModal: () => {},
  }

  static propTypes = {
    hideSidebar: PropTypes.func,
    showAccountDetailModal: PropTypes.func,
    label: PropTypes.string.isRequired,
    checksummedAddress: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }

  state = {
    hasCopied: false,
    copyToClipboardPressed: false,
  }

  copyAddress () {
    copyToClipboard(this.props.checksummedAddress)
    this.context.metricsEvent({
      eventOpts: {
        category: 'Navigation',
        action: 'Home',
        name: 'Copied Address',
      },
    })
    this.setState({ hasCopied: true })
    setTimeout(() => this.setState({ hasCopied: false }), 3000)
  }

  render () {
    const { t } = this.context

    const {
      hideSidebar,
      showAccountDetailModal,
      label,
      checksummedAddress,
      name,
    } = this.props

    const {
      hasCopied,
      copyToClipboardPressed,
    } = this.state

    return (
      <div>
        <div className="flex-column account-details">
          <div className="account-details__sidebar-close" onClick={hideSidebar} />
          <div className="account-details__keyring-label allcaps">
            {label}
          </div>
          <div className="flex-column flex-center account-details__name-container" onClick={showAccountDetailModal}>
            <Identicon diameter={54} address={checksummedAddress} />
            <span className="account-details__account-name">
              {name}
            </span>
            <button className="btn-secondary account-details__details-button">
              {t('details')}
            </button>
          </div>
        </div>
        <Tooltip
          position={'bottom'}
          title={hasCopied ? t('copiedExclamation') : t('copyToClipboard')}
          wrapperClassName="account-details__tooltip"
        >
          <button
            className={classnames({
              'account-details__address': true,
              'account-details__address__pressed': copyToClipboardPressed,
            })}
            onClick={() => this.copyAddress()}
            onMouseDown={() => this.setState({ copyToClipboardPressed: true })}
            onMouseUp={() => this.setState({ copyToClipboardPressed: false })}
          >
            {checksummedAddress.slice(0, 6)}...{checksummedAddress.slice(-4)}
            <i className="fa fa-clipboard" style={{ marginLeft: '8px' }} />
          </button>
        </Tooltip>
      </div>
    )
  }
}
