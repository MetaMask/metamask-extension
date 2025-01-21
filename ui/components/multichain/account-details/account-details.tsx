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
import { AccountDetailsAuthenticate } from './account-details-authenticate';
import { AccountDetailsDisplay } from './account-details-display';
import { AccountDetailsKey } from './account-details-key';
import { EthKeyring } from '@metamask/keyring-internal-api';
import { KeyringMetadata } from '@metamask/keyring-controller';
import { Json } from '@metamask/utils';

export enum AttemptExportState {
  None = 'None',
  PrivateKey = 'PrivateKey',
  SRP = 'SRP',
}

type AccountDetailsProps = { address: string };

export const AccountDetails = ({ address }: AccountDetailsProps) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const useBlockie = useSelector(getUseBlockie);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const {
    metadata: { name },
  } = useSelector((state) => getInternalAccountByAddress(state, address));
  const keyrings: (EthKeyring<Json> & {
    accounts: string[];
    metadata: KeyringMetadata;
  })[] = useSelector(getMetaMaskKeyrings);
  const keyringId = keyrings.find((kr) =>
    kr.accounts.includes(address),
  )?.metadata.id;

  if (!keyringId) {
    throw new Error('Keyring not found');
  }

  const [showHoldToReveal, setShowHoldToReveal] = useState(false);
  const [attemptingExport, setAttemptingExport] = useState<AttemptExportState>(
    AttemptExportState.None,
  );
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);

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
        isOpen={!showHoldToReveal && !srpQuizModalVisible}
        onClose={onClose}
        data-testid="account-details-modal"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            onClose={onClose}
            onBack={
              attemptingExport
                ? () => {
                    dispatch(hideWarning());
                    setPrivateKey('');
                    setAttemptingExport(AttemptExportState.None);
                  }
                : undefined
            }
          >
            {attemptingExport ? t('showPrivateKey') : avatar}
          </ModalHeader>
          <ModalBody>
            {attemptingExport === AttemptExportState.None && (
              <AccountDetailsDisplay
                accounts={accounts}
                accountName={name}
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
      <SRPQuiz
        keyringId={keyringId}
        isOpen={srpQuizModalVisible}
        onClose={() => {
          setSrpQuizModalVisible(false);
          onClose();
        }}
        closeAfterCompleting
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
