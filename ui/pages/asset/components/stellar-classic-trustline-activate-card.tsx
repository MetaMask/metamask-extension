import { errorCodes } from '@metamask/rpc-errors';
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
import type { CaipAssetType } from '@metamask/utils';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { forceUpdateMetamaskState } from '../../../store/actions';
import { requestStellarChangeTrustOptAdd } from '../utils/stellar-snap-client-requests';
import { StellarClassicTrustlineErrorToast } from './stellar-classic-trustline-error-toast';
import { getChainIdFromAssetId } from '../../../../shared/lib/asset-utils';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import type { InternalAccount } from '@metamask/keyring-internal-api';

export type StellarClassicTrustlineActivateCardProps = {
  visible: boolean;
  assetId: CaipAssetType;
  symbol: string;
};

/**
 * Asset detail CTA for Stellar classic tokens with an inactive trustline: opens the Stellar wallet
 * snap to add the trustline (the snap handles funding / activation messaging).
 *
 * @param options0
 * @param options0.visible
 * @param options0.assetId
 * @param options0.symbol
 */
export const StellarClassicTrustlineActivateCard = ({
  visible,
  assetId,
  symbol,
}: StellarClassicTrustlineActivateCardProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const chainId = getChainIdFromAssetId(assetId);
  const account = useSelector((state) =>
    chainId
      ? getInternalAccountBySelectedAccountGroupAndCaip(state, chainId)
      : undefined,
  ) as InternalAccount | undefined;
  const [isAddingTrustline, setIsAddingTrustline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dismissErrorToast = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const handleActivateTrustline = useCallback(async () => {
    if (!account || !chainId) {
      return;
    }
    setErrorMessage(null);
    setIsAddingTrustline(true);
    try {
      const result = await requestStellarChangeTrustOptAdd({
        accountId: account.id,
        assetId,
        scope: chainId,
      });
      if (result.status === false) {
        // Snap showed the account funding prompt; no trustline tx was submitted.
        return;
      }
      await forceUpdateMetamaskState(dispatch);
    } catch (error: unknown) {
      const errorCode = (error as { code?: number })?.code;
      const isUserRejection =
        errorCode === errorCodes.provider.userRejectedRequest;
      if (!isUserRejection) {
        setErrorMessage(t('stellarClassicTrustlineAddError') as string);
      }
    } finally {
      setIsAddingTrustline(false);
    }
  }, [account, assetId, chainId, dispatch, t]);

  if (!visible) {
    return null;
  }

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
            onClick={handleActivateTrustline}
            disabled={isAddingTrustline}
            data-testid="stellar-classic-trustline-activate-button"
            className="self-start"
          >
            {t('stellarClassicActivateOnStellarButton')}
          </Button>
        </Box>
      </Box>
      <StellarClassicTrustlineErrorToast
        message={errorMessage}
        onClose={dismissErrorToast}
        dataTestId="stellar-classic-trustline-add-error-toast"
      />
    </Box>
  );
};
