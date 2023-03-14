import log from 'loglevel';
import React, { ReactNode, useContext, useEffect, useState } from 'react';

import copyToClipboard from 'copy-to-clipboard';
import Button from '../../../ui/button';
import AccountModalContainer from '../account-modal-container';
import {
  toChecksumHexAddress,
  stripHexPrefix,
} from '../../../../../shared/modules/hexstring-utils';
import {
  EVENT,
  EVENT_NAMES,
} from '../../../../../shared/constants/metametrics';
import HoldToRevealModal from '../hold-to-reveal-modal/hold-to-reveal-modal';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useI18nContext } from '../../../../hooks/useI18nContext';

interface ExportPrivateKeyModalProps {
  exportAccount: (password: string, address: string) => string;
  selectedIdentity: {
    name: string;
    address: string;
  };
  warning?: ReactNode;
  showAccountDetailModal: () => void;
  hideModal: () => void;
  hideWarning: () => void;
  clearAccountDetails: () => void;
  previousModalState?: string;
}

const ExportPrivateKeyModal = ({
  clearAccountDetails,
  hideWarning,
  exportAccount,
  selectedIdentity,
  showAccountDetailModal,
  hideModal,
  warning = null,
  previousModalState,
}: ExportPrivateKeyModalProps) => {
  const [password, setPassword] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string | undefined>(undefined);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [showHoldToReveal, setShowHoldToReveal] = useState<boolean>(false);

  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

  useEffect(() => {
    return () => {
      clearAccountDetails();
      hideWarning();
    };
  }, []);

  const exportAccountAndGetPrivateKey = (
    passwordInput: string,
    address: string,
  ): void => {
    exportAccount(passwordInput, address)
      .then((privateKeyRetrieved: string) => {
        trackEvent(
          {
            category: EVENT.CATEGORIES.KEYS,
            event: EVENT_NAMES.KEY_EXPORT_REVEALED,
            properties: {
              key_type: EVENT.KEY_TYPES.PKEY,
            },
          },
          {},
        );
        setPrivateKey(privateKeyRetrieved);
        setShowWarning(false);
        setShowHoldToReveal(true);
      })
      .catch((e) => {
        trackEvent(
          {
            category: EVENT.CATEGORIES.KEYS,
            event: EVENT_NAMES.KEY_EXPORT_FAILED,
            properties: {
              key_type: EVENT.KEY_TYPES.PKEY,
              reason: 'incorrect_password',
            },
          },
          {},
        );

        log.error(e);
      });
  };

  const renderPasswordLabel = (privateKeyInput: string): ReactNode => {
    return (
      <span className="export-private-key-modal__password-label">
        {privateKeyInput ? t('copyPrivateKey') : t('typePassword')}
      </span>
    );
  };

  const renderPasswordInput = (privateKeyInput: string): ReactNode => {
    const plainKey = privateKeyInput && stripHexPrefix(privateKeyInput);

    if (!privateKeyInput) {
      return (
        <input
          type="password"
          className="export-private-key-modal__password-input"
          onChange={(event) => setPassword(event.target.value)}
        />
      );
    }

    return (
      <div
        className="export-private-key-modal__private-key-display"
        onClick={() => {
          copyToClipboard(plainKey);
          trackEvent(
            {
              category: EVENT.CATEGORIES.KEYS,
              event: EVENT_NAMES.KEY_EXPORT_COPIED,
              properties: {
                key_type: EVENT.KEY_TYPES.PKEY,
                copy_method: 'clipboard',
              },
            },
            {},
          );
        }}
      >
        {plainKey}
      </div>
    );
  };

  const renderButtons = (
    privateKeyInput: string,
    address: string,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    hideModal: () => void,
  ): ReactNode => {
    return (
      <div className="export-private-key-modal__buttons">
        {!privateKeyInput && (
          <Button
            icon={null}
            type="secondary"
            large
            className="export-private-key-modal__button export-private-key-modal__button--cancel"
            onClick={() => {
              trackEvent(
                {
                  category: EVENT.CATEGORIES.KEYS,
                  event: EVENT_NAMES.KEY_EXPORT_CANCELED,
                  properties: {
                    key_type: EVENT.KEY_TYPES.PKEY,
                  },
                },
                {},
              );
              hideModal();
            }}
          >
            {t('cancel')}
          </Button>
        )}
        {privateKey ? (
          <Button
            icon={null}
            onClick={() => {
              hideModal();
            }}
            type="primary"
            large
            className="export-private-key-modal__button"
          >
            {t('done')}
          </Button>
        ) : (
          <Button
            icon={null}
            onClick={() => {
              trackEvent(
                {
                  category: EVENT.CATEGORIES.KEYS,
                  event: EVENT_NAMES.KEY_EXPORT_REQUESTED,
                  properties: {
                    key_type: EVENT.KEY_TYPES.PKEY,
                  },
                },
                {},
              );

              exportAccountAndGetPrivateKey(password, address);
            }}
            type="primary"
            large
            className="export-private-key-modal__button"
            disabled={!password}
          >
            {t('confirm')}
          </Button>
        )}
      </div>
    );
  };

  const { name, address } = selectedIdentity;

  return (
    <AccountModalContainer
      className="export-private-key-modal"
      selectedIdentity={selectedIdentity}
      showBackButton={previousModalState === 'ACCOUNT_DETAILS'}
      backButtonAction={() => showAccountDetailModal()}
    >
      {showHoldToReveal ? (
        <HoldToRevealModal
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          onLongPressed={(): void => setShowHoldToReveal(false)}
          willHide={false}
        />
      ) : (
        <>
          <span className="export-private-key-modal__account-name">{name}</span>
          <div className="ellip-address-wrapper">
            {toChecksumHexAddress(address)}
          </div>
          <div className="export-private-key-modal__divider" />
          <span className="export-private-key-modal__body-title">
            {t('showPrivateKeys')}
          </span>
          <div className="export-private-key-modal__password">
            {renderPasswordLabel(privateKey as string)}
            {renderPasswordInput(privateKey as string)}
            {showWarning && warning ? (
              <span className="export-private-key-modal__password--error">
                {warning}
              </span>
            ) : null}
          </div>
          <div className="export-private-key-modal__password--warning">
            {t('privateKeyWarning')}
          </div>
          {renderButtons(privateKey as string, address, hideModal)}
        </>
      )}
    </AccountModalContainer>
  );
};

export default ExportPrivateKeyModal;
