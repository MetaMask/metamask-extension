import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { I18nContext } from '../../../../contexts/i18n';
import { useNewMetricEvent } from '../../../../hooks/useMetricEvent';

export default function ViewOnEtherScanLink({
  txHash,
  blockExplorerUrl,
  isCustomBlockExplorerUrl,
}) {
  const t = useContext(I18nContext);

  const customBlockExplorerLinkClickedEvent = useNewMetricEvent({
    category: 'Swaps',
    event: 'Clicked Custom Block Explorer Link',
    properties: {
      custom_network_url: blockExplorerUrl,
      link_type: 'Transaction Block Explorer',
    },
  });

  return (
    <div
      className={classnames('awaiting-swap__view-on-etherscan', {
        'awaiting-swap__view-on-etherscan--visible': txHash,
        'awaiting-swap__view-on-etherscan--invisible': !txHash,
      })}
      onClick={() => {
        if (isCustomBlockExplorerUrl) {
          customBlockExplorerLinkClickedEvent();
        }
        global.platform.openTab({ url: blockExplorerUrl });
      }}
    >
      {isCustomBlockExplorerUrl
        ? t('viewOnCustomBlockExplorer', [new URL(blockExplorerUrl).hostname])
        : t('viewOnEtherscan')}
    </div>
  );
}

ViewOnEtherScanLink.propTypes = {
  txHash: PropTypes.string,
  blockExplorerUrl: PropTypes.string,
  isCustomBlockExplorerUrl: PropTypes.bool,
};
