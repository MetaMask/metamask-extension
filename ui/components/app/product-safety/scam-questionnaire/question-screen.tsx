import React from 'react';
import {
  Box,
  Button,
  ButtonSize,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { QuestionOption } from './scam-questionnaire.constants';

export type QuestionScreenProps = {
  iconName: IconName;
  title: string;
  subtitle: string;
  options: QuestionOption[];
  selectedKey?: string;
  onSelect: (option: QuestionOption) => void;
  onContinue: () => void;
};

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  iconName,
  title,
  subtitle,
  options,
  selectedKey,
  onSelect,
  onContinue,
}) => {
  const t = useI18nContext();

  return (
    <Box className="flex h-full flex-col">
      <Box className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pt-4">
        <Box className="mb-2 flex justify-center">
          <Box className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <Icon
              name={iconName}
              size={IconSize.Lg}
              color={IconColor.IconDefault}
            />
          </Box>
        </Box>
        <Text variant={TextVariant.HeadingLg} className="text-center">
          {title}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          className="text-center"
        >
          {subtitle}
        </Text>
        <Box className="mt-2 flex flex-col gap-2">
          {options.map((option) => {
            const isSelected = option.key === selectedKey;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelect(option)}
                data-testid={`scam-questionnaire-option-${option.key}`}
                aria-checked={isSelected}
                role="radio"
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-primary-default bg-primary-muted'
                    : 'border-muted'
                }`}
              >
                <Box
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? 'border-primary-default' : 'border-muted'
                  }`}
                >
                  {isSelected && (
                    <Box className="bg-primary-default h-2.5 w-2.5 rounded-full" />
                  )}
                </Box>
                <Box className="flex flex-col">
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                  >
                    {t(option.titleKey)}
                  </Text>
                  {option.subtitleKey && (
                    <Text
                      variant={TextVariant.BodySm}
                      color={TextColor.TextAlternative}
                    >
                      {t(option.subtitleKey)}
                    </Text>
                  )}
                </Box>
              </button>
            );
          })}
        </Box>
      </Box>
      <Box className="p-4">
        <Button
          size={ButtonSize.Lg}
          isFullWidth
          isDisabled={!selectedKey}
          onClick={onContinue}
          data-testid="scam-questionnaire-continue"
        >
          {selectedKey
            ? t('scamQuestionnaireContinue')
            : t('scamQuestionnaireSelectAnswer')}
        </Button>
      </Box>
    </Box>
  );
};
