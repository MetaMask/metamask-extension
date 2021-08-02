import React, { useContext } from 'react';

import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';

import { I18nContext } from '../../../contexts/i18n';

export default function EditGasDisplayEducation() {
  const t = useContext(I18nContext);

  return (
    <div className="edit-gas-display-education">
      <Typography tag="p" color={COLORS.UI4} variant={TYPOGRAPHY.H6}>
        {t('editGasEducationModalIntro')}
      </Typography>
      <Typography
        color={COLORS.BLACK}
        variant={TYPOGRAPHY.h6}
        fontWeight={FONT_WEIGHT.BOLD}
      >
        {t('editGasHigh')}
      </Typography>
      <Typography tag="p" color={COLORS.UI4} variant={TYPOGRAPHY.H6}>
        {t('editGasEducationHighExplanation')}
      </Typography>
      <Typography
        color={COLORS.BLACK}
        variant={TYPOGRAPHY.h6}
        fontWeight={FONT_WEIGHT.BOLD}
      >
        {t('editGasMedium')}
      </Typography>
      <Typography tag="p" color={COLORS.UI4} variant={TYPOGRAPHY.H6}>
        {t('editGasEducationMediumExplanation')}
      </Typography>
      <Typography
        color={COLORS.BLACK}
        variant={TYPOGRAPHY.h6}
        fontWeight={FONT_WEIGHT.BOLD}
      >
        {t('editGasLow')}
      </Typography>
      <Typography tag="p" color={COLORS.UI4} variant={TYPOGRAPHY.H6}>
        {t('editGasEducationLowExplanation')}
      </Typography>
    </div>
  );
}
