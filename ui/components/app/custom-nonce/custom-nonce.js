import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../../.storybook/i18n';
import { Box, ButtonLink, ButtonLinkSize, Text } from '../../component-library';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Display,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';

export default function CustomNonce({
  nextNonce,
  customNonceValue,
  showCustomizeNonceModal,
  ...props
}) {
  const t = useContext(I18nContext);

  return (
    <Box
      className="custom-nonce"
      display={Display.Flex}
      alignItems={AlignItems.center}
      marginBottom={4}
      paddingLeft={4}
      paddingRight={4}
      borderRadius={BorderRadius.MD}
      borderColor={BorderColor.borderMuted}
      borderWidth={1}
      {...props}
    >
      <Box
        display={Display.InlineFlex}
        justifyContent={JustifyContent.flexStart}
        alignItems={AlignItems.center}
      >
        <Text>{t('nonce')}</Text>
        <ButtonLink
          key="editCustomNonce"
          size={ButtonLinkSize.Auto}
          marginLeft={3}
          onClick={() => showCustomizeNonceModal()}
        >
          {t('edit')}
        </ButtonLink>
      </Box>
      <Text variant={TextVariant.bodySmBold} marginLeft="auto">
        {customNonceValue || nextNonce}
      </Text>
    </Box>
  );
}

CustomNonce.propTypes = {
  /**
   * Getting the next suggested nonce
   */
  nextNonce: PropTypes.number,
  /**
   * Custom nonce value
   */
  customNonceValue: PropTypes.string,
  /**
   * Function that is supposed to open the customized nonce modal
   */
  showCustomizeNonceModal: PropTypes.func,
};
