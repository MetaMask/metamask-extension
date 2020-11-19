import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { I18nContext } from '../../../../contexts/i18n'

export default function ViewOnEtherScanLink({
  txHash,
  blockExplorerUrl,
  isCustomBlockExplorerUrl,
}) {
  const t = useContext(I18nContext)
  return (
    <div
      className={classnames('awaiting-swap__view-on-etherscan', {
        'awaiting-swap__view-on-etherscan--visible': txHash,
        'awaiting-swap__view-on-etherscan--invisible': !txHash,
      })}
      onClick={() => global.platform.openTab({ url: blockExplorerUrl })}
    >
      {isCustomBlockExplorerUrl
        ? t('viewOnCustomBlockExplorer', [blockExplorerUrl])
        : t('viewOnEtherscan')}
    </div>
  )
}

ViewOnEtherScanLink.propTypes = {
  txHash: PropTypes.string,
  blockExplorerUrl: PropTypes.string,
  isCustomBlockExplorerUrl: PropTypes.bool,
}
