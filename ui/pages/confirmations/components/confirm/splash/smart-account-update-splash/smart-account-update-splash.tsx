import React, { useCallback, useState } from 'react';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { ORIGIN_METAMASK } from '../../../../../../../shared/constants/app';
import {
  AccountsState,
  getMemoizedInternalAccountByAddress,
} from '../../../../../../selectors';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
} from '../../../../../../helpers/constants/design-system';
import { isHardwareKeyring } from '../../../../../../helpers/utils/hardware';
import { setSmartAccountOptInForAccounts } from '../../../../../../store/actions';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import {
  getSmartAccountOptInForAccounts,
  getUseSmartAccount,
} from '../../../../selectors/preferences';
import { useConfirmContext } from '../../../../context/confirm';
import { useSmartAccountActions } from '../../../../hooks/useSmartAccountActions';
import { SmartAccountUpdateContent } from '../../smart-account-update-content/smart-account-update-content';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function SmartAccountUpdateSplash() {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { handleRejectUpgrade } = useSmartAccountActions();
  const smartAccountOptIn = useSelector(getUseSmartAccount);
  const smartAccountOptInForAccounts: Hex[] = useSelector(
    getSmartAccountOptInForAccounts,
  );
  const { txParams, origin, chainId } = currentConfirmation ?? {};
  const { from } = txParams;
  const [acknowledged, setAcknowledged] = useState(false);
  const account = useSelector((state: AccountsState) =>
    getMemoizedInternalAccountByAddress(state as AccountsState, from),
  );
  const keyringType = account?.metadata?.keyring?.type;
  const acknowledgeSmartAccountUpgrade = useCallback(() => {
    if (!smartAccountOptInForAccounts.includes(from as Hex)) {
      setSmartAccountOptInForAccounts([
        ...smartAccountOptInForAccounts,
        from as Hex,
      ]);
    }
    setAcknowledged(true);
  }, [setAcknowledged, smartAccountOptInForAccounts, from]);

  if (
    !currentConfirmation ||
    origin === ORIGIN_METAMASK ||
    smartAccountOptInForAccounts?.includes(from.toLowerCase() as Hex) ||
    (smartAccountOptIn && !isHardwareKeyring(keyringType)) ||
    acknowledged
  ) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      backgroundColor={BackgroundColor.overlayDefault}
      color={TextColor.primaryDefault}
      className="smart-account-update-splash__container"
    >
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        padding={4}
        className="smart-account-update-splash__inner"
      >
        <SmartAccountUpdateContent
          selectedAddresses={[from as Hex]}
          chainId={chainId}
        />
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={handleRejectUpgrade}
          width={BlockSize.Full}
        >
          {t('smartAccountReject')}
        </Button>
        <Button
          onClick={acknowledgeSmartAccountUpgrade}
          size={ButtonSize.Lg}
          variant={ButtonVariant.Primary}
          width={BlockSize.Full}
        >
          {t('smartAccountAccept')}
        </Button>
      </Box>
    </Box>
  );
}
