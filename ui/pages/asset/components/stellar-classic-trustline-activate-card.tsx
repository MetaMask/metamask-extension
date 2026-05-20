import { errorCodes } from '@metamask/rpc-errors';
import {
  Box,
  BoxBorderColor,
  BoxFlexDirection,
  Button,
  ButtonVariant,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { forceUpdateMetamaskState, showAlert } from '../../../store/actions';
import { requestStellarChangeTrustOptAdd } from '../utils/stellar-snap-client-requests';

export type StellarClassicTrustlineActivateCardProps = {
  visible: boolean;
  account: InternalAccount;
  chainId: CaipChainId;
  assetId: CaipAssetType;
  symbol: string;
};

/**
 * Asset detail CTA for Stellar classic tokens with an inactive trustline: opens the Stellar wallet
 * snap to add the trustline (the snap handles funding / activation messaging).
 * @param options0
 * @param options0.visible
 * @param options0.account
 * @param options0.chainId
 * @param options0.assetId
 * @param options0.symbol
 */
export const StellarClassicTrustlineActivateCard = ({
  visible,
  account,
  chainId,
  assetId,
  symbol,
}: StellarClassicTrustlineActivateCardProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [isAddingTrustline, setIsAddingTrustline] = useState(false);

  const handleActivateTrustline = useCallback(async () => {
    setIsAddingTrustline(true);
    try {
      await requestStellarChangeTrustOptAdd({
        accountId: account.id,
        assetId,
        scope: chainId,
      });
      await forceUpdateMetamaskState(dispatch);
    } catch (error: unknown) {
      const errorCode = (error as { code?: number })?.code;
      const isUserRejection =
        errorCode === errorCodes.provider.userRejectedRequest;
      if (!isUserRejection) {
        dispatch(showAlert(t('stellarClassicTrustlineAddError') as string));
      }
    } finally {
      setIsAddingTrustline(false);
    }
  }, [account.id, assetId, chainId, dispatch, t]);

  if (!visible) {
    return null;
  }

  return (
    <Box
      marginTop={4}
      paddingLeft={4}
      paddingRight={4}
      data-testid="stellar-classic-trustline-activate-card"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={3}
        padding={4}
        borderColor={BoxBorderColor.BorderMuted}
        className="rounded-xl border"
      >
        <Text
          variant={TextVariant.HeadingSm}
          fontWeight={FontWeight.Medium}
        >
          {t('stellarClassicActivateOnStellarTitle', [symbol])}
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('stellarClassicActivateOnStellarBody')}
        </Text>
        <Button
          variant={ButtonVariant.Primary}
          onClick={handleActivateTrustline}
          disabled={isAddingTrustline}
          data-testid="stellar-classic-trustline-activate-button"
        >
          {t('stellarClassicActivateOnStellarButton')}
        </Button>
      </Box>
    </Box>
  );
};
