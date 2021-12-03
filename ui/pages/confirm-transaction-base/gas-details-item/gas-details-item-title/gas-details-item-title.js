import React from 'react';
import { useSelector } from 'react-redux';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getIsMainnet } from '../../../../selectors';
import Box from '../../../../components/ui/box';
import I18nValue from '../../../../components/ui/i18n-value';
import InfoTooltip from '../../../../components/ui/info-tooltip/info-tooltip';
import Typography from '../../../../components/ui/typography/typography';

const GasDetailsItemTitle = () => {
  const t = useI18nContext();
  const isMainnet = useSelector(getIsMainnet);

  return (
    <Box display="flex">
      <Box marginRight={1}>
        <I18nValue messageKey="transactionDetailGasHeadingV2" />
      </Box>
      <span className="gas-details-item-title__estimate">
        (<I18nValue messageKey="transactionDetailGasInfoV2" />)
      </span>
      <InfoTooltip
        contentText={
          <>
            <Typography fontSize="12px">
              {t('transactionDetailGasTooltipIntro', [
                isMainnet ? t('networkNameEthereum') : '',
              ])}
            </Typography>
            <Typography fontSize="12px">
              {t('transactionDetailGasTooltipExplanation')}
            </Typography>
            <Typography fontSize="12px">
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
