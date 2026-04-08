import React from 'react';
import { useSelector } from 'react-redux';
import { NameType } from '@metamask/name-controller';
import { Hex } from '@metamask/utils';
import {
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useAsyncResult } from '../../../../../hooks/useAsync';
import {
  useTrustSignal,
  TrustSignalDisplayState,
} from '../../../../../hooks/useTrustSignals';
import { getExperience } from '../../../../../../shared/constants/verification';
import { getInternalAccounts } from '../../../../../selectors';
import { checkFirstTimeInteraction } from '../../../../../store/actions';
import { useSendContext } from '../../../context/send';
import type { SendAlert } from './types';

export function useFirstTimeInteractionSendAlert(): SendAlert | null {
  const t = useI18nContext();
  const { to, from, chainId } = useSendContext();
  const internalAccounts = useSelector(getInternalAccounts);

  const { state: trustSignalState } = useTrustSignal(
    to || '',
    NameType.ETHEREUM_ADDRESS,
    chainId,
  );

  const isInternalAccount = internalAccounts.some(
    (account: { address: string }) =>
      account.address?.toLowerCase() === to?.toLowerCase(),
  );

  const isVerified = trustSignalState === TrustSignalDisplayState.Verified;
  const isTrustSignalLoading =
    trustSignalState === TrustSignalDisplayState.Loading;
  const isFirstPartyContract = Boolean(
    getExperience((to ?? '0x') as Hex, (chainId ?? '0x') as Hex),
  );

  const shouldSkip =
    !to ||
    !from ||
    !chainId ||
    isInternalAccount ||
    isVerified ||
    isTrustSignalLoading ||
    isFirstPartyContract;

  const { value: isFirstTime } = useAsyncResult(async () => {
    if (shouldSkip) {
      return undefined;
    }
    const chainIdNum = parseInt(chainId, 16);
    return checkFirstTimeInteraction({ from, to, chainId: chainIdNum });
  }, [to, from, chainId, shouldSkip]);

  if (shouldSkip || isFirstTime !== true) {
    return null;
  }

  const styledAddress = (
    <Text
      key="address"
      variant={TextVariant.BodyMd}
      fontWeight={FontWeight.Medium}
      color={TextColor.TextDefault}
    >
      {to}
    </Text>
  );

  return {
    key: 'firstTimeInteraction',
    title: t('sendAlertNewAddressTitle'),
    message: t('sendAlertNewAddressMessage', [styledAddress]),
    acknowledgeButtonLabel: t('continue'),
  };
}
