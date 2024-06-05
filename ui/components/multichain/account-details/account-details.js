import PropTypes from 'prop-types';
import React, { useCallback, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getInternalAccountByAddress,
  getMetaMaskAccountsOrdered,
  getUseBlockie,
} from '../../../selectors';
import {
  clearAccountDetails,
  hideWarning,
  setAccountDetailsAddress,
} from '../../../store/actions';
import HoldToRevealModal from '../../app/modals/hold-to-reveal-modal/hold-to-reveal-modal';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  Modal,
  ModalOverlay,
  Text,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '../../component-library';
import { AddressCopyButton } from '../address-copy-button';
import { AccountDetailsAuthenticate } from './account-details-authenticate';
import { AccountDetailsDisplay } from './account-details-display';
import { AccountDetailsKey } from './account-details-key';

export const AccountDetails = ({ address }) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const useBlockie = useSelector(getUseBlockie);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const {
    metadata: { name },
  } = useSelector((state) => getInternalAccountByAddress(state, address));
  const [showHoldToReveal, setShowHoldToReveal] = useState(false);
  const [attemptingExport, setAttemptingExport] = useState(false);

  // This is only populated when the user properly authenticates
  const [privateKey, setPrivateKey] = useState('');

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
    <>
      {/* This is the Modal that says "Show private key" on top and has a few states */}
      <Modal
        isOpen={!showHoldToReveal}
        onClose={onClose}
        data-testid="account-details-modal"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            onClose={onClose}
            onBack={
              attemptingExport &&
              (() => {
                dispatch(hideWarning());
                setPrivateKey('');
                setAttemptingExport(false);
              })
            }
          >
            {attemptingExport ? t('showPrivateKey') : avatar}
          </ModalHeader>
          <ModalBody>
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
                    setPrivateKey={setPrivateKey}
                    setShowHoldToReveal={setShowHoldToReveal}
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
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* This is the Modal that says "Hold to reveal private key" */}
      <HoldToRevealModal
        isOpen={showHoldToReveal}
        onClose={() => {
          trackEvent({
            category: MetaMetricsEventCategory.Keys,
            event: MetaMetricsEventName.KeyExportCanceled,
            properties: {
              key_type: MetaMetricsEventKeyType.Pkey,
            },
          });
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

AccountDetails.propTypes = {
  /**
   * The address to show account details for
   */
  address: PropTypes.string,
};
