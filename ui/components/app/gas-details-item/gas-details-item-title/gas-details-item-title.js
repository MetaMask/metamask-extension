import React from 'react';
import { useSelector } from 'react-redux';

import { TypographyVariant } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getIsMainnet } from '../../../../selectors';
import Box from '../../../ui/box';
import Link from '../../../ui/link';
import InfoTooltip from '../../../ui/info-tooltip/info-tooltip';
import Typography from '../../../ui/typography/typography';

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
            <Typography variant={TypographyVariant.H7}>
              {t('transactionDetailGasTooltipIntro', [
                isMainnet ? t('networkNameEthereum') : '',
              ])}
            </Typography>
            <Typography variant={TypographyVariant.H7}>
              {t('transactionDetailGasTooltipExplanation')}
            </Typography>
            <Typography variant={TypographyVariant.H7}>
              <Link href="https://community.metamask.io/t/what-is-gas-why-do-transactions-take-so-long/3172">
                {t('transactionDetailGasTooltipConversion')}
              </Link>
            </Typography>
          </>
        }
        position="bottom"
      />
    </Box>
  );
};

export default GasDetailsItemTitle;
