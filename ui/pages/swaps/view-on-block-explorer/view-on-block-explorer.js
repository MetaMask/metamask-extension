import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import Box from '../../../components/ui/box';
import { I18nContext } from '../../../contexts/i18n';
import { getURLHostName } from '../../../helpers/utils/util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { EVENT } from '../../../../shared/constants/metametrics';

export default function ViewOnBlockExplorer({ blockExplorerUrl }) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);

  return (
    <Box marginTop={6} className="view-on-block-explorer">
      <a
        href="#"
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
        {t('viewOnCustomBlockExplorer', [
          t('blockExplorerSwapAction'),
          getURLHostName(blockExplorerUrl),
        ])}
      </a>
    </Box>
  );
}

ViewOnBlockExplorer.propTypes = {
  blockExplorerUrl: PropTypes.string,
};
