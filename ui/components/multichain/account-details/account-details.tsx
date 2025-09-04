import PropTypes from 'prop-types';
import React, { useCallback, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { KeyringObject, KeyringTypes } from '@metamask/keyring-controller';
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
  getHDEntropyIndex,
  getInternalAccountByAddress,
  getMetaMaskAccountsOrdered,
  getMetaMaskKeyrings,
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

import SRPQuiz from '../../app/srp-quiz-modal';
import { findKeyringId } from '../../../../shared/lib/keyring';
import { isAbleToRevealSrp } from '../../../helpers/utils/util';
import { isMultichainWalletSnap } from '../../../../shared/lib/accounts';
import { AttemptExportState } from '../../../../shared/constants/accounts';
import { AccountDetailsAuthenticate } from './account-details-authenticate';
import { AccountDetailsDisplay } from './account-details-display';
import { AccountDetailsKey } from './account-details-key';

type AccountDetailsProps = { address: string };

export const AccountDetails = ({ address }: AccountDetailsProps) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const useBlockie = useSelector(getUseBlockie);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );
  const {
    metadata: {
      name,
      keyring: { type: keyringType },
    },
    options: { entropySource },
    type,
  } = account;

  const snapId = account.metadata.snap?.id;

  const [showHoldToReveal, setShowHoldToReveal] = useState(false);
  let showModal = !showHoldToReveal;

  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  showModal = !showHoldToReveal && !srpQuizModalVisible;

  const keyrings: KeyringObject[] = useSelector(getMetaMaskKeyrings);

  // Snap accounts have an entropy source that is the id of the hd keyring
  const keyringId =
    keyringType === KeyringTypes.snap &&
    isMultichainWalletSnap(snapId) &&
    entropySource
      ? entropySource
      : findKeyringId(keyrings, {
          address,
        });

  const isAbleToExportSrp = isAbleToRevealSrp(account, keyrings);
  const displayExportSrpQuiz = keyringId && isAbleToExportSrp;

  const [attemptingExport, setAttemptingExport] = useState<AttemptExportState>(
    AttemptExportState.None,
  );

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
        isOpen={showModal}
        onClose={onClose}
        data-testid="account-details-modal"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            onClose={onClose}
            onBack={() => {
              if (attemptingExport === AttemptExportState.PrivateKey) {
                dispatch(hideWarning());
                setPrivateKey('');
                setAttemptingExport(AttemptExportState.None);
              } else if (attemptingExport === AttemptExportState.None) {
                onClose();
              }
            }}
          >
            {attemptingExport === AttemptExportState.PrivateKey
              ? t('showPrivateKey')
              : avatar}
          </ModalHeader>
          <ModalBody>
            {attemptingExport === AttemptExportState.None && (
              <AccountDetailsDisplay
                accounts={accounts}
                accountName={name}
                accountType={type}
                address={address}
                onExportClick={(attemptExportMode: AttemptExportState) => {
                  if (attemptExportMode === AttemptExportState.SRP) {
                    setSrpQuizModalVisible(true);
                  }
                  setAttemptingExport(attemptExportMode);
                }}
              />
            )}
            {attemptingExport === AttemptExportState.PrivateKey && (
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
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              key_type: MetaMetricsEventKeyType.Pkey,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hd_entropy_index: hdEntropyIndex,
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
      {displayExportSrpQuiz && (
        <SRPQuiz
          keyringId={keyringId}
          isOpen={srpQuizModalVisible}
          onClose={() => {
            setSrpQuizModalVisible(false);
            onClose();
          }}
          closeAfterCompleting
        />
      )}
    </>
  );
};

AccountDetails.propTypes = {
  /**
   * The address to show account details for
   */
  address: PropTypes.string,
};
