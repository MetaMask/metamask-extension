import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../../.storybook/i18n';
import { Box, ButtonLink, Text } from '../../component-library';
import {
  AlignItems,
  BorderRadius,
  Display,
  JustifyContent,
  Size,
  TextVariant,
} from '../../../helpers/constants/design-system';

export default function CustomNonce({
  nextNonce,
  customNonceValue,
  showCustomizeNonceModal,
}) {
  const t = useContext(I18nContext);

  return (
    <Box
      display={Display.Flex}
      marginBottom={4}
      paddingTop={3}
      paddingRight={3}
      paddingBottom={4}
      paddingLeft={3}
      borderRadius={BorderRadius.MD}
      alignItems={AlignItems.center}
      className="custom-nonce__content"
    >
      <Box
        className="custom-nonce__header"
        display={Display.InlineFlex}
        justifyContent={JustifyContent.flexStart}
        alignItems={AlignItems.center}
      >
        <Text variant={TextVariant.bodySm} as="h6">
          {t('nonce')}
        </Text>
        <ButtonLink
          key="editCustomNonce"
          size={Size.auto}
          marginLeft={3}
          onClick={() => showCustomizeNonceModal()}
        >
          {t('edit')}
        </ButtonLink>
      </Box>
      <Text
        className="custom-nonce__value"
        variant={TextVariant.bodySmBold}
        as="h6"
      >
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
