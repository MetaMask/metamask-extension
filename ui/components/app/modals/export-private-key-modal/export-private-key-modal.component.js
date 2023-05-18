import log from 'loglevel';
import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import Box from '../../../ui/box';
import {
  BUTTON_SIZES,
  BUTTON_VARIANT,
  BannerAlert,
  Button,
  Text,
} from '../../../component-library';
import AccountModalContainer from '../account-modal-container';
import { toChecksumHexAddress } from '../../../../../shared/modules/hexstring-utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import HoldToRevealModal from '../hold-to-reveal-modal/hold-to-reveal-modal';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BLOCK_SIZES,
  BorderColor,
  BorderStyle,
  Color,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import PrivateKeyDisplay from './private-key';
import PasswordInput from './password-input';

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

  const { name, address } = selectedIdentity;

  if (showHoldToReveal) {
    return (
      <AccountModalContainer
        className="export-private-key-modal"
        selectedIdentity={selectedIdentity}
        showBackButton={previousModalState === 'ACCOUNT_DETAILS'}
        backButtonAction={() => showAccountDetailModal()}
      >
        <HoldToRevealModal
          onLongPressed={() => setShowHoldToReveal(false)}
          willHide={false}
          holdToRevealType="PrivateKey"
        />
      </AccountModalContainer>
    );
  }

  return (
    <AccountModalContainer
      className="export-private-key-modal"
      selectedIdentity={selectedIdentity}
      showBackButton={previousModalState === 'ACCOUNT_DETAILS'}
      backButtonAction={() => showAccountDetailModal()}
    >
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
      {privateKey ? (
        <PrivateKeyDisplay privateKey={privateKey} />
      ) : (
        <PasswordInput setPassword={setPassword} />
      )}
      {showWarning && (
        <Text color={Color.errorDefault} variant={TextVariant.bodySm}>
          {warning}
        </Text>
      )}
      <BannerAlert
        padding={[1, 3, 0, 3]}
        marginLeft={5}
        marginRight={5}
        marginTop={4}
        severity="danger"
      >
        {t('privateKeyWarning')}
      </BannerAlert>
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        width={BLOCK_SIZES.FULL}
        justifyContent={JustifyContent.spaceBetween}
        marginTop={3}
        padding={[5, 0, 5, 0]}
      >
        {!privateKey && (
          <Button
            type={BUTTON_VARIANT.SECONDARY}
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
            type={BUTTON_VARIANT.PRIMARY}
            size={BUTTON_SIZES.LG}
            width={BLOCK_SIZES.FULL}
            onClick={() => {
              hideModal();
            }}
          >
            {t('done')}
          </Button>
        ) : (
          <Button
            type={BUTTON_VARIANT.PRIMARY}
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
