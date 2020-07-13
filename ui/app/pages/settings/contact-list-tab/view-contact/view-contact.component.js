import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../../components/ui/identicon'
import Copy from '../../../../components/ui/icon/copy-icon.component'

import Button from '../../../../components/ui/button/button.component'
import copyToClipboard from 'copy-to-clipboard'

import Tooltip from '../../../../components/ui/tooltip-v2'

function quadSplit (address) {
  return (
    '0x ' +
    address
      .slice(2)
      .match(/.{1,4}/g)
      .join(' ')
  )
}

export default class ViewContact extends PureComponent {
  state = {
    copied: false,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    name: PropTypes.string,
    address: PropTypes.string,
    history: PropTypes.object,
    checkSummedAddress: PropTypes.string,
    memo: PropTypes.string,
    editRoute: PropTypes.string,
  }

  render () {
    const { t } = this.context
    const {
      history,
      name,
      address,
      checkSummedAddress,
      memo,
      editRoute,
    } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <div className="settings-page__header address-book__header">
            <Identicon address={address} diameter={60} />
            <div className="address-book__header__name">{name}</div>
          </div>
          <div className="address-book__view-contact__group">
            <Button
              type="secondary"
              onClick={() => {
                history.push(`${editRoute}/${address}`)
              }}
            >
              {t('edit')}
            </Button>
          </div>
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              {t('ethereumPublicAddress')}
            </div>
            <div className="address-book__view-contact__group__value">
              <div className="address-book__view-contact__group__static-address">
                {quadSplit(checkSummedAddress)}
              </div>
              <Tooltip
                wrapperClassName="address-book__tooltip-wrapper"
                position="bottom"
                title={
                  this.state.copied
                    ? t('copiedExclamation')
                    : t('copyToClipboard')
                }
              >
                <button
                  className="address-book__view-contact__group__static-address--copy-icon"
                  onClick={() => {
                    const { checkSummedAddress } = this.props
                    this.setState({ copied: true })
                    setTimeout(() => this.setState({ copied: false }), 3000)
                    copyToClipboard(checkSummedAddress)
                  }}
                >
                  <Copy size={20} color="#3098DC" />
                </button>
              </Tooltip>
            </div>
          </div>
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label--capitalized">
              {t('memo')}
            </div>
            <div className="address-book__view-contact__group__static-address">
              {memo}
            </div>
          </div>
        </div>
      </div>
    )
  }
}
