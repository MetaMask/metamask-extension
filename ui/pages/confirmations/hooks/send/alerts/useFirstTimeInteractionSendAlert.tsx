import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { NameType } from '@metamask/name-controller';
import { Hex } from '@metamask/utils';
import {
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { isValidHexAddress } from '../../../../../../shared/lib/hexstring-utils';
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
  const { to, toResolved, from, chainId } = useSendContext();
  const internalAccounts = useSelector(getInternalAccounts);

  // Use the resolved hex address for all on-chain lookups so the alert also
  // fires for ENS / name-resolved recipients. The user-typed `to` is kept
  // only for display in the alert message.
  const resolvedAddress =
    toResolved && isValidHexAddress(toResolved) ? toResolved : undefined;

  const { state: trustSignalState } = useTrustSignal(
    resolvedAddress || '',
    NameType.ETHEREUM_ADDRESS,
    chainId,
  );

  const isInternalAccount = internalAccounts.some(
    (account: { address: string }) =>
      account.address?.toLowerCase() === resolvedAddress?.toLowerCase(),
  );

  const isVerified = trustSignalState === TrustSignalDisplayState.Verified;
  const isTrustSignalLoading =
    trustSignalState === TrustSignalDisplayState.Loading;
  const isFirstPartyContract = Boolean(
    getExperience((resolvedAddress ?? '0x') as Hex, (chainId ?? '0x') as Hex),
  );

  const shouldSkip =
    !resolvedAddress ||
    !from ||
    !chainId ||
    isInternalAccount ||
    isVerified ||
    isTrustSignalLoading ||
    isFirstPartyContract;

  const { value: isFirstTime } = useAsyncResult(async () => {
    if (shouldSkip || !resolvedAddress) {
      return undefined;
    }
    const chainIdNum = Number.parseInt(chainId, 16);
    return checkFirstTimeInteraction({
      from,
      to: resolvedAddress,
      chainId: chainIdNum,
    });
  }, [resolvedAddress, from, chainId, shouldSkip]);

  const isActive = !shouldSkip && isFirstTime === true;

  return useMemo(() => {
    if (!isActive || !to) {
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
  }, [isActive, to, t]);
}
