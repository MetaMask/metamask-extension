import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import { InternalAccount } from '@metamask/keyring-internal-api';

import { AccountDetailsRow } from '../account-details-row';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import { IconColor } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isAbleToExportAccount } from '../../../helpers/utils/util';
import HoldToRevealModal from '../../app/modals/hold-to-reveal-modal/hold-to-reveal-modal';
import { AccountDetailsAuthenticate } from '../../multichain/account-details/account-details-authenticate';
import { AccountDetailsKey } from '../../multichain/account-details/account-details-key';
import { hideWarning } from '../../../store/actions';

type AccountShowPrivateKeyRowProps = {
  account: InternalAccount;
};

export const AccountShowPrivateKeyRow = ({
  account,
}: AccountShowPrivateKeyRowProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [showHoldToReveal, setShowHoldToReveal] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);

  const keyringType = account.metadata.keyring?.type;
  const canExportPrivateKey = isAbleToExportAccount(keyringType);

  if (!canExportPrivateKey) {
    return null;
  }

  const handleClick = () => {
    setShowPrivateKeyModal(true);
  };

  const handleClose = () => {
    setShowPrivateKeyModal(false);
    setPrivateKey('');
    setShowHoldToReveal(false);
    dispatch(hideWarning());
  };

  const showModal = showPrivateKeyModal && !showHoldToReveal;

  return (
    <>
      <AccountDetailsRow
        label={t('privateKey')}
        value={''}
        endAccessory={
          <ButtonIcon
            iconName={IconName.ArrowRight}
            ariaLabel={t('next')}
            color={IconColor.iconAlternative}
            size={ButtonIconSize.Md}
          />
        }
        onClick={handleClick}
      />

      <Modal
        isOpen={showModal}
        onClose={handleClose}
        data-testid="private-key-modal"
      >
        <ModalOverlay />
        <ModalContent modalDialogProps={{ paddingLeft: 4, paddingRight: 4 }}>
          <ModalHeader onClose={handleClose}>{t('showPrivateKey')}</ModalHeader>

          {!privateKey && !showHoldToReveal && (
            <AccountDetailsAuthenticate
              address={account.address}
              onCancel={handleClose}
              setPrivateKey={setPrivateKey}
              setShowHoldToReveal={setShowHoldToReveal}
            />
          )}

          {privateKey && !showHoldToReveal && (
            <AccountDetailsKey
              accountName={account.metadata?.name || ''}
              onClose={handleClose}
              privateKey={privateKey}
            />
          )}
        </ModalContent>
      </Modal>

      <HoldToRevealModal
        isOpen={showHoldToReveal}
        onClose={() => {
          setPrivateKey('');
          setShowHoldToReveal(false);
        }}
        onLongPressed={() => {
          setShowHoldToReveal(false);
        }}
        holdToRevealType="PrivateKey"
      />
    </>
  );
};
