import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { checksumAddress } from '../../../helpers/utils/util'
import Identicon from '../../../components/ui/identicon'
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display'
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common'
import Tooltip from '../../../components/ui/tooltip-v2'
import AccountMismatchWarning from '../../../components/ui/account-mismatch-warning/account-mismatch-warning.component'
import { useI18nContext } from '../../../hooks/useI18nContext'

export default function AccountListItem ({
  account,
  className,
  displayAddress = false,
  displayBalance = true,
  handleClick,
  icon = null,
  balanceIsCached,
  showFiat = true,
}) {
  const t = useI18nContext()
  const { name, address, balance } = account || {}

  return (
    <div
      className={`account-list-item ${className}`}
      onClick={() => handleClick && handleClick({ name, address, balance })}
    >

      <div className="account-list-item__top-row">
        <Identicon
          address={address}
          className="account-list-item__identicon"
          diameter={18}
        />

        <div className="account-list-item__account-name">{ name || address }</div>

        {icon && <div className="account-list-item__icon">{ icon }</div>}

        <AccountMismatchWarning address={address} />
      </div>

      {displayAddress && name && (
        <div className="account-list-item__account-address">
          { checksumAddress(address) }
        </div>
      )}

      {displayBalance && (
        <Tooltip
          position="left"
          title={t('balanceOutdated')}
          disabled={!balanceIsCached}
          style={{
            left: '-20px !important',
          }}
        >
          <div
            className={classnames('account-list-item__account-balances', {
              'account-list-item__cached-balances': balanceIsCached,
            })}
          >
            <div className="account-list-item__primary-cached-container">
              <UserPreferencedCurrencyDisplay
                type={PRIMARY}
                value={balance}
                hideTitle
              />
              {
                balanceIsCached
                  ? <span className="account-list-item__cached-star">*</span>
                  : null
              }
            </div>
            {showFiat && (
              <UserPreferencedCurrencyDisplay
                type={SECONDARY}
                value={balance}
                hideTitle
              />
            )}
          </div>
        </Tooltip>
      )}

    </div>
  )
}

AccountListItem.propTypes = {
  account: PropTypes.object,
  className: PropTypes.string,
  displayAddress: PropTypes.bool,
  displayBalance: PropTypes.bool,
  handleClick: PropTypes.func,
  icon: PropTypes.node,
  balanceIsCached: PropTypes.bool,
  showFiat: PropTypes.bool,
}
