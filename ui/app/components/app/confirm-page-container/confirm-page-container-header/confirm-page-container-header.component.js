import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
} from '../../../../../../app/scripts/lib/enums'
import NetworkDisplay from '../../network-display'
import Identicon from '../../../ui/identicon'
import { base32AddressSlicer } from '../../../../helpers/utils/util'

export default class ConfirmPageContainerHeader extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    accountAddress: PropTypes.string,
    base32AccountAddress: PropTypes.string,
    showAccountInHeader: PropTypes.bool,
    showEdit: PropTypes.bool,
    onEdit: PropTypes.func,
    children: PropTypes.node,
  }

  renderTop() {
    const {
      onEdit,
      showEdit,
      accountAddress,
      base32AccountAddress,
      showAccountInHeader,
    } = this.props
    const windowType = window.METAMASK_UI_TYPE
    const isFullScreen =
      windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
      windowType !== ENVIRONMENT_TYPE_POPUP

    if (!showEdit && isFullScreen) {
      return null
    }

    return (
      <div className="confirm-page-container-header__row">
        {!showAccountInHeader ? (
          <div
            className="confirm-page-container-header__back-button-container"
            style={{
              visibility: showEdit ? 'initial' : 'hidden',
            }}
          >
            <img src="/images/caret-left.svg" />
            <span
              className="confirm-page-container-header__back-button"
              onClick={() => onEdit()}
            >
              {this.context.t('edit')}
            </span>
          </div>
        ) : null}
        {showAccountInHeader ? (
          <div className="confirm-page-container-header__address-container">
            <div className="confirm-page-container-header__address-identicon">
              <Identicon address={accountAddress} diameter={24} />
            </div>
            <div className="confirm-page-container-header__address">
              {base32AddressSlicer(base32AccountAddress)}
            </div>
          </div>
        ) : null}
        {!isFullScreen && <NetworkDisplay />}
      </div>
    )
  }

  render() {
    const { children } = this.props

    return (
      <div className="confirm-page-container-header">
        {this.renderTop()}
        {children}
      </div>
    )
  }
}
