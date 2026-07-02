import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React from 'react';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAssetActivation } from '../hooks/useAssetActivation';
import { Asset } from '../types/asset';
import { StellarClassicTrustlineErrorToast } from './stellar-classic-trustline-error-toast';

export type StellarClassicTrustlineActivateCardProps = {
  asset: Asset;
};

/**
 * Asset detail CTA for Stellar classic tokens with an inactive trustline: opens the Stellar wallet
 * snap to add the trustline (the snap handles funding / activation messaging).
 *
 * @param params - Trustline activate card parameters
 * @param params.asset
 */
export const StellarClassicTrustlineActivateCard = ({
  asset,
}: StellarClassicTrustlineActivateCardProps) => {
  const t = useI18nContext();
  const {symbol} = asset;
  const { activateAsset, isActivating, errorMessage, dismissErrorMessage } = useAssetActivation({ asset });

  return (
    <Box
      marginTop={3}
      marginBottom={4}
      paddingLeft={4}
      paddingRight={4}
      data-testid="stellar-classic-trustline-activate-card"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Start}
        gap={3}
        padding={4}
        backgroundColor={BoxBackgroundColor.WarningMuted}
        className="rounded-xl"
      >
        <Icon
          name={IconName.Danger}
          size={IconSize.Lg}
          color={IconColor.WarningDefault}
          className="shrink-0"
        />
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          className="min-w-0 flex-1"
        >
          <Box flexDirection={BoxFlexDirection.Column} gap={1}>
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Regular}
              color={TextColor.TextDefault}
            >
              {t('stellarClassicActivateOnStellar', [symbol])}
            </Text>
          </Box>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Sm}
            onClick={activateAsset}
            disabled={isActivating}
            data-testid="stellar-classic-trustline-activate-button"
            className="self-start"
          >
            {t('stellarClassicActivateOnStellarButton')}
          </Button>
        </Box>
      </Box>
      <StellarClassicTrustlineErrorToast
        message={errorMessage}
        onClose={dismissErrorMessage}
        dataTestId="stellar-classic-trustline-add-error-toast"
      />
    </Box>
  );
};
