import React, { useState } from 'react';
import PropTypes from 'prop-types';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import Box from '../../../ui/box';
import {
  BannerAlert,
  Button,
  ButtonIcon,
  BUTTON_TYPES,
  FormTextField,
  Icon,
  IconName,
  IconSize,
  Label,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  BLOCK_SIZES,
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

const EthSignModal = ({ hideModal }) => {
  const [isEthSignChecked, setIsEthSignChecked] = useState(false);
  const [showTextField, setShowTextField] = useState(false);
  const [inputKeyword, setInputKeyword] = useState('');
  const [showEnable, setShowEnable] = useState(false);
  const [showError, setShowError] = useState(false);
  const t = useI18nContext();
  const handleCancel = () => {
    hideModal();
  };
  const handleKeyPress = (event) => {
    if (inputKeyword !== '' && event.key === 'Enter') {
      event.preventDefault();
      if (inputKeyword === 'I only sign what I understand') {
        setShowEnable(true);
      } else {
        setShowError(true);
      }
    }
  };
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
        code. Learn more.
      </Text>
      <BannerAlert severity={SEVERITIES.DANGER} marginTop={6} marginBottom={6}>
        If you have been asked to turn this setting on, you might be getting
        scammed.
      </BannerAlert>
      {showTextField ? (
        <FormTextField
          id="enter-eth-sign-text"
          label="Enter “I only sign what I understand” to continue"
          error={showError}
          helpText={showError ? `The text is incorrect. Try again.` : null}
          onChange={(event) => setInputKeyword(event.target.value)}
          value={inputKeyword}
          inputProps={{
            onKeyPress: handleKeyPress,
          }}
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
        <Button
          type={BUTTON_TYPES.SECONDARY}
          width={BLOCK_SIZES.FULL}
          onClick={handleCancel}
        >
          {t('cancel')}
        </Button>
        {showTextField ? (
          <Button
            type={BUTTON_TYPES.PRIMARY}
            danger
            width={BLOCK_SIZES.FULL}
            disabled={!showEnable}
            onClick={() => setShowTextField(true)}
          >
            Enable
          </Button>
        ) : (
          <Button
            type={BUTTON_TYPES.PRIMARY}
            width={BLOCK_SIZES.FULL}
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
