import React from 'react';
import {
  Box,
  FontWeight,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export type SecurityCheckHeaderProps = {
  /** Zero-based index of the current step. Pass `null` to hide progress (e.g. on the terminal warning screen). */
  currentStep: number | null;
  totalSteps: number;
  onBack: () => void;
};

export const SecurityCheckHeader: React.FC<SecurityCheckHeaderProps> = ({
  currentStep,
  totalSteps,
  onBack,
}) => {
  const t = useI18nContext();

  // Start the fill at 1/N so the first step doesn't read as 0%.
  const fillPercent =
    currentStep === null ? 100 : ((currentStep + 1) / totalSteps) * 100;

  return (
    <Box>
      {/* Three zones (back / centered title / equal-width spacer) so the title
          stays optically centered regardless of the back button. */}
      <Box className="flex items-center px-4 py-3">
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          ariaLabel={t('back')}
          size={ButtonIconSize.Md}
          onClick={onBack}
          data-testid="scam-questionnaire-back"
        />
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          className="flex-1 text-center"
        >
          {t('scamQuestionnaireHeaderTitle')}
        </Text>
        <Box className="h-8 w-8" />
      </Box>
      {currentStep !== null && (
        <Box
          className="bg-muted h-1 w-full overflow-hidden"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={currentStep + 1}
        >
          <Box
            className="bg-primary-default h-full transition-[width] duration-300 ease-out"
            style={{ width: `${fillPercent}%` }}
          />
        </Box>
      )}
    </Box>
  );
};
