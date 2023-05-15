import React from 'react';
import { useSelector } from 'react-redux';

import { TextVariant } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getIsMainnet } from '../../../../selectors';
import Box from '../../../ui/box';
import InfoTooltip from '../../../ui/info-tooltip/info-tooltip';
import { Text } from '../../../component-library';

const GasDetailsItemTitle = () => {
  const t = useI18nContext();
  const isMainnet = useSelector(getIsMainnet);

  return (
    <Box display="flex">
      <Box marginRight={1}>{t('gas')}</Box>
      <span className="gas-details-item-title__estimate">
        ({t('transactionDetailGasInfoV2')})
      </span>
      <InfoTooltip
        contentText={
          <>
            <Text variant={TextVariant.bodySm} as="h6">
              {t('transactionDetailGasTooltipIntro', [
                isMainnet ? t('networkNameEthereum') : '',
              ])}
            </Text>
            <Text variant={TextVariant.bodySm} as="h6">
              {t('transactionDetailGasTooltipExplanation')}
            </Text>
            <Text variant={TextVariant.bodySm} as="h6">
              <a
                href="https://community.metamask.io/t/what-is-gas-why-do-transactions-take-so-long/3172"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('transactionDetailGasTooltipConversion')}
              </a>
            </Text>
          </>
        }
        position="bottom"
      />
    </Box>
  );
};

export default GasDetailsItemTitle;
