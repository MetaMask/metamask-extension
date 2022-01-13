import React from 'react';
import { useSelector } from 'react-redux';

import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getIsMainnet } from '../../../../selectors';
import Box from '../../../ui/box';
import I18nValue from '../../../ui/i18n-value';
import InfoTooltip from '../../../ui/info-tooltip/info-tooltip';
import Typography from '../../../ui/typography/typography';

const GasDetailsItemTitle = () => {
  const t = useI18nContext();
  const isMainnet = useSelector(getIsMainnet);

  return (
    <Box display="flex">
      <Box marginRight={1}>
        <I18nValue messageKey="gas" />
      </Box>
      <span className="gas-details-item-title__estimate">
        (<I18nValue messageKey="transactionDetailGasInfoV2" />)
      </span>
      <InfoTooltip
        contentText={
          <>
            <Typography variant={TYPOGRAPHY.H7}>
              {t('transactionDetailGasTooltipIntro', [
                isMainnet ? t('networkNameEthereum') : '',
              ])}
            </Typography>
            <Typography variant={TYPOGRAPHY.H7}>
              {t('transactionDetailGasTooltipExplanation')}
            </Typography>
            <Typography variant={TYPOGRAPHY.H7}>
              <a
                href="https://community.metamask.io/t/what-is-gas-why-do-transactions-take-so-long/3172"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('transactionDetailGasTooltipConversion')}
              </a>
            </Typography>
          </>
        }
        position="bottom"
      />
    </Box>
  );
};

export default GasDetailsItemTitle;
