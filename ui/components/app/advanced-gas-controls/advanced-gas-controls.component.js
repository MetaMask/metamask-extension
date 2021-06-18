import React, { useContext, useState } from 'react';
import { I18nContext } from '../../../contexts/i18n';
import Typography from '../../ui/typography/typography';
import {
  FONT_WEIGHT,
  TYPOGRAPHY,
  COLORS,
} from '../../../helpers/constants/design-system';
import AdvancedGasControlsRow from './advanced-gas-controls-row.component';

export default function AdvancedGasControls() {
  const t = useContext(I18nContext);

  const [gasLimit, setGasLimit] = useState(0);
  const [maxPriorityFee, setMaxPriorityFee] = useState(0);
  const [maxFee, setMaxFee] = useState(0);

  return (
    <div className="advanced-gas-controls">
      <AdvancedGasControlsRow
        titleText={t('gasLimit')}
        onChange={setGasLimit}
        tooltipText=""
        titleDetailText=""
        value={gasLimit}
      />
      <AdvancedGasControlsRow
        titleText={t('maxPriorityFee')}
        tooltipText=""
        onChange={setMaxPriorityFee}
        value={maxPriorityFee}
        titleDetailText={
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
      <AdvancedGasControlsRow
        titleText={t('maxFee')}
        tooltipText=""
        onChange={setMaxFee}
        value={maxFee}
        titleDetailText={
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
    </div>
  );
}
