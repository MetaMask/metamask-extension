import PropTypes from 'prop-types';
import React, { useCallback, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
import {
  KeyringMetadata,
  KeyringObject,
  KeyringTypes,
} from '@metamask/keyring-controller';
///: END:ONLY_INCLUDE_IF
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
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  getMetaMaskKeyrings,
  getMetaMaskKeyringsMetadata,
  ///: END:ONLY_INCLUDE_IF
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
///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
import SRPQuiz from '../../app/srp-quiz-modal';
import { findKeyringId } from '../../../../shared/lib/keyring';
import { isAbleToRevealSrp } from '../../../helpers/utils/util';
import { isMultichainWalletSnap } from '../../../../shared/lib/accounts';
///: END:ONLY_INCLUDE_IF
import { AttemptExportState } from '../../../../shared/constants/accounts';
import { AccountDetailsAuthenticate } from './account-details-authenticate';
import { AccountDetailsDisplay } from './account-details-display';
import { AccountDetailsKey } from './account-details-key';

type AccountDetailsProps = { address: string };

export const AccountDetails = ({ address }: AccountDetailsProps) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const useBlockie = useSelector(getUseBlockie);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );
  const {
    metadata: {
      name,
      ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
      keyring: { type: keyringType },
      ///: END:ONLY_INCLUDE_IF
    },
    ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
    options: { entropySource },
    ///: END:ONLY_INCLUDE_IF
  } = account;

  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  const snapId = account.metadata.snap?.id;
  ///: END:ONLY_INCLUDE_IF

  const [showHoldToReveal, setShowHoldToReveal] = useState(false);
  let showModal = !showHoldToReveal;

  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  showModal = !showHoldToReveal && !srpQuizModalVisible;

  const keyrings: KeyringObject[] = useSelector(getMetaMaskKeyrings);
  const keyringsMetadata: KeyringMetadata[] = useSelector(
    getMetaMaskKeyringsMetadata,
  );

  // Snap accounts have an entropy source that is the id of the hd keyring
  const keyringId =
    keyringType === KeyringTypes.snap &&
    isMultichainWalletSnap(snapId) &&
    entropySource
      ? entropySource
      : findKeyringId(keyrings, keyringsMetadata, {
          address,
        });

  const isAbleToExportSrp = isAbleToRevealSrp(account, keyrings);
  const displayExportSrpQuiz = keyringId && isAbleToExportSrp;

  ///: END:ONLY_INCLUDE_IF
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
                address={address}
                onExportClick={(attemptExportMode: AttemptExportState) => {
                  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
                  if (attemptExportMode === AttemptExportState.SRP) {
                    setSrpQuizModalVisible(true);
                  }
                  ///: END:ONLY_INCLUDE_IF
                  setAttemptingExport(attemptExportMode);
                }}
                onClose={onClose}
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
      {
        ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
        displayExportSrpQuiz && (
          <SRPQuiz
            keyringId={keyringId}
            isOpen={srpQuizModalVisible}
            onClose={() => {
              setSrpQuizModalVisible(false);
              onClose();
            }}
            closeAfterCompleting
          />
        )
        ///: END:ONLY_INCLUDE_IF
      }
    </>
  );
};

AccountDetails.propTypes = {
  /**
   * The address to show account details for
   */
  address: PropTypes.string,
};
