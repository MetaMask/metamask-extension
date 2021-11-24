import React from 'react';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import I18nValue from '../../../ui/i18n-value';
import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { hexWEIToDecGWEI } from '../../../../helpers/utils/conversions.util';

const AdvancedGasFeeInputSubtext = () => {
  const { estimatedBaseFee } = useGasFeeContext();

  const estimatedBaseFeeInDecGWEI = hexWEIToDecGWEI(estimatedBaseFee, {
    numberOfDecimals: 6,
  });

  return (
    <Box className="advanced-gas-fee-popover__input-subtext">
      <Box className="advanced-gas-fee-popover__input-subtext">
        <Typography
          tag={TYPOGRAPHY.Paragraph}
          variant={TYPOGRAPHY.H8}
          color={COLORS.UI4}
          fontWeight={FONT_WEIGHT.BOLD}
          boxProps={{ marginRight: 1 }}
        >
          <I18nValue messageKey="currentTitle" />
        </Typography>
        <Typography
          tag={TYPOGRAPHY.Paragraph}
          variant={TYPOGRAPHY.H8}
          color={COLORS.UI4}
          boxProps={{ marginRight: 1 }}
        >
          {estimatedBaseFeeInDecGWEI}
        </Typography>
        <img height="18" src="./images/high-arrow.svg" alt="" />
      </Box>
      <Box marginLeft={4} className="advanced-gas-fee-popover__input-subtext">
        <Typography
          tag={TYPOGRAPHY.Paragraph}
          variant={TYPOGRAPHY.H8}
          color={COLORS.UI4}
          fontWeight={FONT_WEIGHT.BOLD}
          boxProps={{ marginRight: 1 }}
        >
          <I18nValue messageKey="twelveHrTitle" />
        </Typography>
        <Typography
          tag={TYPOGRAPHY.Paragraph}
          variant={TYPOGRAPHY.H8}
          color={COLORS.UI4}
          boxProps={{ marginRight: 1 }}
        >
          23-359 GWEI
        </Typography>
      </Box>
    </Box>
  );
};

export default AdvancedGasFeeInputSubtext;
