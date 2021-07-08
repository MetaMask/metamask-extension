import React, { useContext, useState } from 'react';

import { I18nContext } from '../../../contexts/i18n';
import Typography from '../../ui/typography/typography';
import {
  FONT_WEIGHT,
  TYPOGRAPHY,
  COLORS,
} from '../../../helpers/constants/design-system';
import FormField from '../../ui/form-field';

export default function AdvancedGasControls() {
  const t = useContext(I18nContext);

  const [gasLimit, setGasLimit] = useState(0);
  const [maxPriorityFee, setMaxPriorityFee] = useState(0);
  const [maxFee, setMaxFee] = useState(0);

  // Used in legacy version
  const [gasPrice, setGasPrice] = useState(0);

  return (
    <div className="advanced-gas-controls">
      <FormField
        titleText={t('gasLimit')}
        onChange={setGasLimit}
        tooltipText=""
        value={gasLimit}
        numeric
      />
      {process.env.SHOW_EIP_1559_UI ? (
        <>
          <FormField
            titleText={t('maxPriorityFee')}
            titleUnit="(GWEI)"
            tooltipText=""
            onChange={setMaxPriorityFee}
            value={maxPriorityFee}
            numeric
            titleDetail={
              <>
                <Typography
                  tag="span"
                  color={COLORS.UI4}
                  variant={TYPOGRAPHY.H8}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  {t('gasFeeEstimate')}:
                </Typography>{' '}
                <Typography
                  tag="span"
                  color={COLORS.UI4}
                  variant={TYPOGRAPHY.H8}
                ></Typography>
              </>
            }
          />
          <FormField
            titleText={t('maxFee')}
            titleUnit="(GWEI)"
            tooltipText=""
            onChange={setMaxFee}
            value={maxFee}
            numeric
            titleDetail={
              <>
                <Typography
                  tag="span"
                  color={COLORS.UI4}
                  variant={TYPOGRAPHY.H8}
                  fontWeight={FONT_WEIGHT.BOLD}
                >
                  {t('gasFeeEstimate')}:
                </Typography>{' '}
                <Typography
                  tag="span"
                  color={COLORS.UI4}
                  variant={TYPOGRAPHY.H8}
                ></Typography>
              </>
            }
          />
        </>
      ) : (
        <>
          <FormField
            titleText={t('gasPrice')}
            titleUnit="(GWEI)"
            onChange={setGasPrice}
            tooltipText={t('editGasPriceTooltip')}
            value={gasPrice}
            numeric
          />
        </>
      )}
    </div>
  );
}
