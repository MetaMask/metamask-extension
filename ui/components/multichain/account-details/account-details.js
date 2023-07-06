import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  setAccountDetailsAddress,
  clearAccountDetails,
  hideWarning,
} from '../../../store/actions';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Box,
} from '../../component-library';
import { getMetaMaskAccountsOrdered } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  TextVariant,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { AddressCopyButton } from '../address-copy-button';
import { AccountDetailsDisplay } from './account-details-display';
import { AccountDetailsAuthenticate } from './account-details-authenticate';
import { AccountDetailsKey } from './account-details-key';

export const AccountDetails = ({ address }) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const useBlockie = useSelector((state) => state.metamask.useBlockie);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const { name } = accounts.find((account) => account.address === address);

  const [attemptingExport, setAttemptingExport] = useState(false);

  // This is only populated when the user properly authenticates
  const privateKey = useSelector(
    (state) => state.appState.accountDetail.privateKey,
  );

  const onClose = useCallback(() => {
    dispatch(setAccountDetailsAddress(''));
    dispatch(clearAccountDetails());
    dispatch(hideWarning());
  }, [dispatch]);

  const avatar = (
    <AvatarAccount
      variant={
        useBlockie
          ? AvatarAccountVariant.Blockies
          : AvatarAccountVariant.Jazzicon
      }
      address={address}
      size={AvatarAccountSize.Lg}
      style={{ margin: '0 auto' }}
    />
  );

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          onBack={
            attemptingExport
              ? () => {
                  dispatch(hideWarning());
                  setAttemptingExport(false);
                }
              : null
          }
        >
          {attemptingExport ? t('showPrivateKey') : avatar}
        </ModalHeader>
        {attemptingExport ? (
          <>
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              flexDirection={FlexDirection.Column}
            >
              {avatar}
              <Text
                marginTop={2}
                marginBottom={2}
                variant={TextVariant.bodyLgMedium}
                style={{ wordBreak: 'break-word' }}
              >
                {name}
              </Text>
              <AddressCopyButton address={address} shorten />
            </Box>
            {privateKey ? (
              <AccountDetailsKey
                accountName={name}
                onClose={onClose}
                privateKey={privateKey}
              />
            ) : (
              <AccountDetailsAuthenticate
                address={address}
                onCancel={onClose}
              />
            )}
          </>
        ) : (
          <AccountDetailsDisplay
            accounts={accounts}
            accountName={name}
            address={address}
            onExportClick={() => setAttemptingExport(true)}
          />
        )}
      </ModalContent>
    </Modal>
  );
};

AccountDetails.propTypes = {
  address: PropTypes.string,
};
