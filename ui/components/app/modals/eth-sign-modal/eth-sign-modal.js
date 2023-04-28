import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import Box from '../../../ui/box';
import {
  BannerAlert,
  Button,
  ButtonIcon,
  ButtonLink,
  BUTTON_VARIANT,
  FormTextField,
  Icon,
  IconName,
  IconSize,
  Label,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  IconColor,
  JustifyContent,
  SEVERITIES,
  Size,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import CheckBox from '../../../ui/check-box';
import { setDisabledRpcMethodPreference } from '../../../../store/actions';
import { getDisabledRpcMethodPreferences } from '../../../../selectors';

const EthSignModal = ({ hideModal }) => {
  const [isEthSignChecked, setIsEthSignChecked] = useState(false);
  const [showTextField, setShowTextField] = useState(false);
  const [inputKeyword, setInputKeyword] = useState('');
  const disabledRpcMethodPreferences = useSelector(
    getDisabledRpcMethodPreferences,
  );

  const t = useI18nContext();
  const dispatch = useDispatch();
  const handleCancel = () => {
    hideModal();
  };

  const handleSubmit = () => {
    dispatch(
      setDisabledRpcMethodPreference(
        'eth_sign',
        !disabledRpcMethodPreferences?.eth_sign,
      ),
    );
    hideModal();
  };

  const isValid = inputKeyword === 'I only sign what I understand';
  return (
    <Box
      className="eth-sign-modal"
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      justifyContent={JustifyContent.flexStart}
      padding={4}
    >
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        marginBottom={6}
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
          onClick={handleCancel}
          ariaLabel={t('close')}
        />
      </Box>

      <Text variant={TextVariant.headingMd} textAlign={TextAlign.Center}>
        Use at your own risk
      </Text>
      <Text variant={TextVariant.bodyMd}>
        Allowing eth_sign requests can make you vulnerable to phishing attacks.
        Always review the URL and be careful when signing messages that contain
        code.{' '}
        <ButtonLink
          href="https://support.metamask.io/hc/en-us/articles/14764161421467"
          externalLink
        >
          {t('learnMoreUpperCase')}
        </ButtonLink>
      </Text>
      <BannerAlert severity={SEVERITIES.DANGER} marginTop={6} marginBottom={6}>
        If you have been asked to turn this setting on, you might be getting
        scammed.
      </BannerAlert>
      {showTextField ? (
        <FormTextField
          id="enter-eth-sign-text"
          label="Enter “I only sign what I understand” to continue"
          error={inputKeyword.length > 0 && !isValid}
          helpText={
            inputKeyword.length > 0 &&
            !isValid &&
            `The text is incorrect. Try again.`
          }
          onChange={(event) => setInputKeyword(event.target.value)}
          value={inputKeyword}
          onPaste={(event) => event.preventDefault()}
        />
      ) : (
        <Box
          flexDirection={FLEX_DIRECTION.ROW}
          alignItems={AlignItems.flexStart}
          gap={2}
        >
          <CheckBox
            id="eth-sign__checkbox"
            className="eth-sign__checkbox"
            dataTestId="eth-sign__checkbox"
            checked={isEthSignChecked}
            onClick={() => {
              setIsEthSignChecked(!isEthSignChecked);
            }}
          />
          <Label htmlFor="eth-sign__checkbox">
            <Text variant={TextVariant.bodyMd} as="span">
              I understand that I can lose all of my funds and NFTs if I enable
              eth_sign requests.
            </Text>
          </Label>
        </Box>
      )}
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
        marginTop={6}
      >
        <Button type={BUTTON_VARIANT.SECONDARY} block onClick={handleCancel}>
          {t('cancel')}
        </Button>
        {showTextField ? (
          <Button
            type={BUTTON_VARIANT.PRIMARY}
            danger
            block
            disabled={!isValid}
            onClick={handleSubmit}
          >
            {t('enableSnap')}
          </Button>
        ) : (
          <Button
            type={BUTTON_VARIANT.PRIMARY}
            block
            disabled={!isEthSignChecked}
            onClick={() => setShowTextField(true)}
          >
            {t('continue')}
          </Button>
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
