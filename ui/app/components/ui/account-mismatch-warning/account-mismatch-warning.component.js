import React, { useContext } from 'react'
import Tooltip from '../tooltip-v2'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { getSelectedAccount } from '../../../selectors'
import InfoIcon from '../icon/info-icon.component'

import { I18nContext } from '../../../contexts/i18n'

export default function AccountMismatchWarning ({ address }) {
  const selectedAccount = useSelector(getSelectedAccount)
  const t = useContext(I18nContext)
  if (selectedAccount.address === address) {
    return null
  }

  return (
    <Tooltip
      position="bottom"
      html={<p>{t('notCurrentAccount')}</p>}
      wrapperClassName="account-mismatch-warning__tooltip-wrapper"
      containerClassName="account-mismatch-warning__tooltip-container"
    >
      <div className="account-mismatch-warning__tooltip-container-icon"><InfoIcon severity="warning" /></div>
    </Tooltip>
  )
}

AccountMismatchWarning.propTypes = {
  address: PropTypes.string.isRequired,
}
