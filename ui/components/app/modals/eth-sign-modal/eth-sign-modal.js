import React, { useState } from 'react';
import PropTypes from 'prop-types';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import Box from '../../../ui/box';
import {
  BannerAlert,
  Button,
  ButtonIcon,
  BUTTON_TYPES,
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
  const t = useI18nContext();
  const handleCancel = () => {
    hideModal();
  };
  return (
    <Box
      className="eth-sign-modal"
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      justifyContent={JustifyContent.flexStart}
      padding={6}
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
      <BannerAlert severity={SEVERITIES.DANGER}>
        If you have been asked to turn this setting on, you might be getting
        scammed.
      </BannerAlert>
      <Box
        flexDirection={FLEX_DIRECTION.ROW}
        alignItems={AlignItems.flexStart}
        marginLeft={3}
        marginRight={3}
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
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <Button type={BUTTON_TYPES.SECONDARY} width={BLOCK_SIZES.FULL}>
          {t('cancel')}
        </Button>
        <Button type={BUTTON_TYPES.PRIMARY} width={BLOCK_SIZES.FULL}>
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
};

EthSignModal.propTypes = {
  // The function to close the Modal
  hideModal: PropTypes.func,
};
export default withModalProps(EthSignModal);
