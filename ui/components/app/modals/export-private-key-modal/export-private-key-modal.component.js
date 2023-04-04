import log from 'loglevel';
import React, { useContext, useEffect, useState } from 'react';
import copyToClipboard from 'copy-to-clipboard';
import PropTypes from 'prop-types';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import Box from '../../../ui/box';
import {
  BUTTON_SIZES,
  BUTTON_TYPES,
  BannerAlert,
  Button,
  Text,
} from '../../../component-library';
import AccountModalContainer from '../account-modal-container';
import {
  toChecksumHexAddress,
  stripHexPrefix,
} from '../../../../../shared/modules/hexstring-utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import HoldToRevealModal from '../hold-to-reveal-modal/hold-to-reveal-modal';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  AlignItems,
  BLOCK_SIZES,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Color,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';

const ExportPrivateKeyModal = ({
  clearAccountDetails,
  hideWarning,
  exportAccount,
  selectedIdentity,
  showAccountDetailModal,
  hideModal,
  warning = null,
  previousModalState,
}) => {
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState(null);
  const [showWarning, setShowWarning] = useState(true);
  const [showHoldToReveal, setShowHoldToReveal] = useState(false);

  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

  useEffect(() => {
    return () => {
      clearAccountDetails();
      hideWarning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportAccountAndGetPrivateKey = async (passwordInput, address) => {
    try {
      const privateKeyRetrieved = await exportAccount(passwordInput, address);
      trackEvent(
        {
          category: MetaMetricsEventCategory.Keys,
          event: MetaMetricsEventName.KeyExportRevealed,
          properties: {
            key_type: MetaMetricsEventKeyType.Pkey,
          },
        },
        {},
      );
      setPrivateKey(privateKeyRetrieved);
      setShowWarning(false);
      setShowHoldToReveal(true);
    } catch (e) {
      trackEvent(
        {
          category: MetaMetricsEventCategory.Keys,
          event: MetaMetricsEventName.KeyExportFailed,
          properties: {
            key_type: MetaMetricsEventKeyType.Pkey,
            reason: 'incorrect_password',
          },
        },
        {},
      );

      log.error(e);
    }
  };

  const renderPasswordLabel = (privateKeyInput) => {
    return (
      <Text
        as="span"
        color={Color.textDefault}
        marginBottom={2}
        variant={TextVariant.bodySm}
      >
        {privateKeyInput ? t('copyPrivateKey') : t('typePassword')}
      </Text>
    );
  };

  const renderPasswordInput = (privateKeyInput) => {
    const plainKey = privateKeyInput && stripHexPrefix(privateKeyInput);

    if (!privateKeyInput) {
      return (
        <input
          aria-label="input-password"
          type="password"
          className="export-private-key-modal__password-input"
          onChange={(event) => setPassword(event.target.value)}
        />
      );
    }

    return (
      <Box
        className="export-private-key-modal__private-key-display"
        borderStyle={BorderStyle.solid}
        borderColor={BorderColor.borderDefault}
        borderRadius={BorderRadius.XS}
        borderWidth={1}
        padding={[2, 3, 2]}
        color={Color.errorDefault}
        onClick={() => {
          copyToClipboard(plainKey);
          trackEvent({
            category: MetaMetricsEventCategory.Keys,
            event: MetaMetricsEventName.KeyExportCopied,
            properties: {
              key_type: MetaMetricsEventKeyType.Pkey,
              copy_method: 'clipboard',
            },
          });
        }}
      >
        {plainKey}
      </Box>
    );
  };

  const renderButtons = (privateKeyInput, address, hideModalFunc) => {
    return (
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        width={BLOCK_SIZES.FULL}
        justifyContent={JustifyContent.spaceBetween}
        padding={[0, 5]}
      >
        {!privateKeyInput && (
          <Button
            type={BUTTON_TYPES.SECONDARY}
            size={BUTTON_SIZES.LG}
            width={BLOCK_SIZES.HALF}
            marginRight={4}
            onClick={() => {
              trackEvent({
                category: MetaMetricsEventCategory.Keys,
                event: MetaMetricsEventName.KeyExportCanceled,
                properties: {
                  key_type: MetaMetricsEventKeyType.Pkey,
                },
              });
              hideModal();
            }}
          >
            {t('cancel')}
          </Button>
        )}
        {privateKey ? (
          <Button
            type={BUTTON_TYPES.PRIMARY}
            size={BUTTON_SIZES.LG}
            width={BLOCK_SIZES.FULL}
            onClick={() => {
              hideModalFunc();
            }}
          >
            {t('done')}
          </Button>
        ) : (
          <Button
            type={BUTTON_TYPES.PRIMARY}
            size={BUTTON_SIZES.LG}
            width={BLOCK_SIZES.HALF}
            onClick={() => {
              trackEvent({
                category: MetaMetricsEventCategory.Keys,
                event: MetaMetricsEventName.KeyExportRequested,
                properties: {
                  key_type: MetaMetricsEventKeyType.Pkey,
                },
              });

              exportAccountAndGetPrivateKey(password, address);
            }}
            disabled={!password}
          >
            {t('confirm')}
          </Button>
        )}
      </Box>
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
          onLongPressed={() => setShowHoldToReveal(false)}
          willHide={false}
        />
      ) : (
        <>
          <Text
            as="span"
            marginTop={2}
            variant={TextVariant.bodyLgMedium}
            fontWeight={FONT_WEIGHT.NORMAL}
          >
            {name}
          </Text>
          <Box
            className="ellip-address-wrapper"
            borderStyle={BorderStyle.solid}
            borderColor={BorderColor.borderDefault}
            borderWidth={1}
            marginTop={2}
            padding={[1, 2, 1, 2]}
          >
            {toChecksumHexAddress(address)}
          </Box>
          <Box
            className="export-private-key-modal__divider"
            width={BLOCK_SIZES.FULL}
            margin={[5, 0, 3, 0]}
          />
          <Text
            variant={TextVariant.bodyLgMedium}
            margin={[4, 0, 4, 0]}
            fontWeight={FONT_WEIGHT.NORMAL}
          >
            {t('showPrivateKeys')}
          </Text>
          <Box
            flexDirection={FLEX_DIRECTION.COLUMN}
            alignItems={AlignItems.flexStart}
          >
            {renderPasswordLabel(privateKey)}
            {renderPasswordInput(privateKey)}
            {showWarning ? (
              <Text color={Color.errorDefault} variant={TextVariant.bodySm}>
                {warning}
              </Text>
            ) : null}
          </Box>
          <BannerAlert
            padding={[1, 3, 0, 3]}
            marginLeft={5}
            marginRight={5}
            marginTop={4}
            severity="danger"
          >
            {t('privateKeyWarning')}
          </BannerAlert>
          {renderButtons(privateKey, address, hideModal)}
        </>
      )}
    </AccountModalContainer>
  );
};

ExportPrivateKeyModal.propTypes = {
  exportAccount: PropTypes.func.isRequired,
  selectedIdentity: PropTypes.object.isRequired,
  warning: PropTypes.node,
  showAccountDetailModal: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired,
  hideWarning: PropTypes.func.isRequired,
  clearAccountDetails: PropTypes.func.isRequired,
  previousModalState: PropTypes.string,
};

export default withModalProps(ExportPrivateKeyModal);
