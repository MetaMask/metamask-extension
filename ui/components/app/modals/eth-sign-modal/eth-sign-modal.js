import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import {
  BannerAlert,
  Box,
  ButtonIcon,
  ButtonLink,
  ButtonPrimary,
  ButtonSecondary,
  ButtonSecondarySize,
  Checkbox,
  FormTextField,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  Severity,
  Size,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { setDisabledRpcMethodPreference } from '../../../../store/actions';
import { getDisabledRpcMethodPreferences } from '../../../../selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';

const EthSignModal = ({ hideModal }) => {
  const [isEthSignChecked, setIsEthSignChecked] = useState(false);
  const [showTextField, setShowTextField] = useState(false);
  const [inputKeyword, setInputKeyword] = useState('');
  const disabledRpcMethodPreferences = useSelector(
    getDisabledRpcMethodPreferences,
  );

  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const handleSubmit = () => {
    dispatch(
      setDisabledRpcMethodPreference(
        'eth_sign',
        !disabledRpcMethodPreferences.eth_sign,
      ),
    );
    hideModal();
  };

  const isValid = inputKeyword === t('toggleEthSignModalFormValidation');
  return (
    <Box
      className="eth-sign-modal"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.flexStart}
      padding={4}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        marginBottom={4}
        justifyContent={JustifyContent.center}
      >
        <Icon
          className="eth-sign-modal__warning-icon"
          name={IconName.Danger}
          color={IconColor.errorDefault}
          size={IconSize.Lg}
        />
        <ButtonIcon
          className="eth-sign-modal__close"
          iconName={IconName.Close}
          size={Size.SM}
          onClick={() => hideModal()}
          ariaLabel={t('close')}
        />
      </Box>

      <Text
        variant={TextVariant.headingMd}
        textAlign={TextAlign.Center}
        marginBottom={6}
      >
        {t('toggleEthSignModalTitle')}
      </Text>
      <Text variant={TextVariant.bodyMd}>
        {t('toggleEthSignModalDescription')}
        <ButtonLink
          href="https://support.metamask.io/hc/en-us/articles/14764161421467"
          externalLink
        >
          {t('learnMoreUpperCase')}
        </ButtonLink>
      </Text>
      <BannerAlert severity={Severity.Danger} marginTop={6} marginBottom={6}>
        {t('toggleEthSignModalBannerText')}
        {t('toggleEthSignModalBannerBoldText')}
      </BannerAlert>
      {showTextField ? (
        <FormTextField
          id="enter-eth-sign-text"
          label={t('toggleEthSignModalFormLabel')}
          error={inputKeyword.length > 0 && !isValid}
          helpText={
            inputKeyword.length > 0 &&
            !isValid &&
            t('toggleEthSignModalFormError')
          }
          onChange={(event) => setInputKeyword(event.target.value)}
          value={inputKeyword}
          onPaste={(event) => event.preventDefault()}
        />
      ) : (
        <Box
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.flexStart}
          gap={2}
        >
          <Checkbox
            id="eth-sign-checkbox"
            className="eth-sign__checkbox"
            data-testid="eth-sign-checkbox"
            isChecked={isEthSignChecked}
            onChange={() => {
              setIsEthSignChecked(!isEthSignChecked);
            }}
            label={t('toggleEthSignModalCheckBox')}
          />
        </Box>
      )}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
        marginTop={6}
      >
        <ButtonSecondary
          onClick={() => hideModal()}
          size={ButtonSecondarySize.Lg}
          block
        >
          {t('cancel')}
        </ButtonSecondary>
        {showTextField ? (
          <ButtonPrimary
            danger
            block
            disabled={!isValid}
            onClick={handleSubmit}
            size={Size.LG}
          >
            {t('enableSnap')}
          </ButtonPrimary>
        ) : (
          <ButtonPrimary
            block
            disabled={!isEthSignChecked}
            size={Size.LG}
            onClick={() => {
              setShowTextField(true);
              trackEvent({
                category: MetaMetricsEventCategory.Settings,
                event: MetaMetricsEventName.OnboardingWalletAdvancedSettings,
                properties: {
                  location: 'Settings',
                  enable_eth_sign: true,
                },
              });
            }}
          >
            {t('continue')}
          </ButtonPrimary>
        )}
      </Box>
    </Box>
  );
};

EthSignModal.propTypes = {
  // The function to close the Modal
  hideModal: PropTypes.func,
};
export default withModalProps(EthSignModal);
