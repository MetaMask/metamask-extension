import React from 'react';
import { useSelector } from 'react-redux';
import { Box, ButtonSecondary } from '../../../../components/component-library';
import { BlockSize } from '../../../../helpers/constants/design-system';
import { t } from '../../../../../app/scripts/translate';
import { getIsSwapsChain } from '../../../../selectors';
import Tooltip from '../../../../components/ui/tooltip';
import { getMmiPortfolioUrl } from '../../../../selectors/institutional/selectors';

const AssetMmiSwapButton = () => {
  const isSwapsChain = useSelector(getIsSwapsChain);
  const mmiPortfolioUrl = useSelector(getMmiPortfolioUrl);
  return (
    <Box width={BlockSize.Full}>
      <Tooltip
        disabled={isSwapsChain}
        title={t('currentlyUnavailable')}
        position="top"
      >
        <ButtonSecondary
          disabled={!isSwapsChain}
          padding={5}
          width={BlockSize.Full}
          onClick={() => {
            global.platform.openTab({
              url: `${mmiPortfolioUrl}/swap`,
            });
          }}
        >
          {t('swap')}
        </ButtonSecondary>
      </Tooltip>
    </Box>
  );
};

export default AssetMmiSwapButton;
