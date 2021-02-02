import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../../components/ui/identicon'

import Button from '../../../../components/ui/button/button.component'
import copyToClipboard from 'copy-to-clipboard'

export default class ViewContact extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    name: PropTypes.string,
    address: PropTypes.string,
    base32Address: PropTypes.string,
    history: PropTypes.object,
    memo: PropTypes.string,
    editRoute: PropTypes.string,
  }

  render() {
    const { t } = this.context
    const {
      history,
      name,
      address,
      base32Address,
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
                {base32Address}
              </div>
              <img
                className="address-book__view-contact__group__static-address--copy-icon"
                onClick={() => copyToClipboard(base32Address)}
                src="/images/copy-to-clipboard.svg"
              />
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
