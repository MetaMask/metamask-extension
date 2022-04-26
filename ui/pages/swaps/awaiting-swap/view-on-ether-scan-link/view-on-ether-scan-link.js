import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { I18nContext } from '../../../../contexts/i18n';
import { getURLHostName } from '../../../../helpers/utils/util';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { EVENT } from '../../../../../shared/constants/metametrics';

export default function ViewOnEtherScanLink({
  txHash,
  blockExplorerUrl,
  isCustomBlockExplorerUrl,
}) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);

  return (
    <div
      className={classnames('awaiting-swap__view-on-etherscan', {
        'awaiting-swap__view-on-etherscan--visible': txHash,
        'awaiting-swap__view-on-etherscan--invisible': !txHash,
      })}
      onClick={() => {
        trackEvent({
          event: 'Clicked Block Explorer Link',
          category: EVENT.CATEGORIES.SWAPS,
          properties: {
            link_type: 'Transaction Block Explorer',
            action: 'Swap Transaction',
            block_explorer_domain: getURLHostName(blockExplorerUrl),
          },
        });
        global.platform.openTab({ url: blockExplorerUrl });
      }}
    >
      {isCustomBlockExplorerUrl
        ? t('viewOnCustomBlockExplorer', [
            t('blockExplorerSwapAction'),
            getURLHostName(blockExplorerUrl),
          ])
        : t('viewOnEtherscan', [t('blockExplorerSwapAction')])}
    </div>
  );
}

ViewOnEtherScanLink.propTypes = {
  txHash: PropTypes.string,
  blockExplorerUrl: PropTypes.string,
  isCustomBlockExplorerUrl: PropTypes.bool,
};
