import React, { useCallback, useState } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';

import { ORIGIN_METAMASK } from '../../../../../../../shared/constants/app';
import {
  AccountsState,
  getMemoizedInternalAccountByAddress,
} from '../../../../../../selectors';
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
} from '../../../../../../components/component-library';
import { isHardwareKeyring } from '../../../../../../helpers/utils/hardware';
import { setSmartAccountOptIn } from '../../../../../../store/actions';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getUseSmartAccount } from '../../../../selectors/preferences';
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
  const { txParams, origin } = currentConfirmation ?? {};
  const { from } = txParams;
  const [acknowledged, setAcknowledged] = useState(false);
  const account = useSelector((state: AccountsState) =>
    getMemoizedInternalAccountByAddress(state as AccountsState, from),
  );
  const dispatch = useDispatch();
  const keyringType = account?.metadata?.keyring?.type;
  const acknowledgeSmartAccountUpgrade = useCallback(() => {
    dispatch(setSmartAccountOptIn(true));
    setAcknowledged(true);
  }, [dispatch, setAcknowledged]);

  if (
    !currentConfirmation ||
    origin === ORIGIN_METAMASK ||
    (smartAccountOptIn && !isHardwareKeyring(keyringType)) ||
    acknowledged
  ) {
    return null;
  }

  return (
    <Modal
      isOpen={true}
      onClose={handleRejectUpgrade}
      className="smart-account-update-splash__container"
    >
      <ModalContent className="smart-account-update-splash__inner">
        <ModalBody>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.SpaceBetween}
            padding={4}
          >
            <SmartAccountUpdateContent />
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box
            flexDirection={BoxFlexDirection.Column}
            style={{ width: '100%', gap: '12px' }}
          >
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handleRejectUpgrade}
              style={{ width: '100%' }}
            >
              {t('smartAccountReject')}
            </Button>
            <Button
              onClick={acknowledgeSmartAccountUpgrade}
              size={ButtonSize.Lg}
              variant={ButtonVariant.Primary}
              style={{ width: '100%' }}
            >
              {t('smartAccountAccept')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
