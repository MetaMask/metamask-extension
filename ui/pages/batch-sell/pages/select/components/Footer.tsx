import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React, { useMemo } from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  MAX_SELECTED_ALLOWED_TOKENS,
  MIN_SELECTED_ALLOWED_TOKENS,
} from '../../../../../constants/batch-sell';

type FooterProps = {
  selectedAssetsId: string[];
  onSubmit: () => void;
};

export const Footer = ({ onSubmit, selectedAssetsId }: FooterProps) => {
  const t = useI18nContext();

  const buttonTextMessageId = useMemo(() => {
    if (selectedAssetsId.length === 0) {
      return ['next'];
    }

    if (selectedAssetsId.length > MAX_SELECTED_ALLOWED_TOKENS) {
      return ['batchSellMaxSelectedTokens', [MAX_SELECTED_ALLOWED_TOKENS]];
    }

    return selectedAssetsId.length >= MIN_SELECTED_ALLOWED_TOKENS
      ? ['batchSellContinueNAssetsCTAPlural', [selectedAssetsId.length]]
      : ['batchSellContinueNAssetsCTASingle', [selectedAssetsId.length]];
  }, [selectedAssetsId]);

  return (
    <Box padding={6}>
      <Button
        size={ButtonSize.Lg}
        variant={ButtonVariant.Primary}
        isFullWidth
        onClick={onSubmit}
        disabled={
          selectedAssetsId.length === 0 ||
          selectedAssetsId.length > MAX_SELECTED_ALLOWED_TOKENS
        }
      >
        <Text
          variant={TextVariant.ButtonLabelMd}
          fontWeight={FontWeight.Medium}
          textAlign={TextAlign.Center}
          color={TextColor.PrimaryInverse}
        >
          {t(...buttonTextMessageId)}
        </Text>
      </Button>
    </Box>
  );
};
