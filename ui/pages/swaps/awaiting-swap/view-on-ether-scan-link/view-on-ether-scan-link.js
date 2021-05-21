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

  const blockExplorerLinkClickedEvent = useNewMetricEvent({
    category: 'Swaps',
    event: 'Clicked Block Explorer Link',
    properties: {
      link_type: 'Transaction Block Explorer',
      action: 'Swap Transaction',
      block_explorer_domain: blockExplorerUrl
        ? new URL(blockExplorerUrl)?.hostname
        : '',
    },
  });

  return (
    <div
      className={classnames('awaiting-swap__view-on-etherscan', {
        'awaiting-swap__view-on-etherscan--visible': txHash,
        'awaiting-swap__view-on-etherscan--invisible': !txHash,
      })}
      onClick={() => {
        blockExplorerLinkClickedEvent();
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
