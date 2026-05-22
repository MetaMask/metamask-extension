import PropTypes from 'prop-types';
import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { MINUTE } from '../../../../shared/constants/time';
import {
  Display,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ButtonSecondary, Text } from '../../component-library';

function ExportTextContainer({ text = '', onClickCopy = null }) {
  const t = useI18nContext();

  // useCopyToClipboard analysis: As of writing this, this is only used in RevealSeedPage, which is the sensitive SRP
  const [copied, handleCopy] = useCopyToClipboard({ clearDelayMs: MINUTE });

  return (
    <Box
      className="flex rounded-md border border-solid"
      justifyContent={BoxJustifyContent.Center}
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      borderColor={BoxBorderColor.BorderDefault}
      padding={4}
      gap={4}
    >
      <Text
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        className="notranslate"
        variant={TextVariant.bodyLgMedium}
        data-testid="srp_text"
      >
        {text}
      </Text>
      <ButtonSecondary
        className="export-text-container__button"
        block
        onClick={() => {
          if (onClickCopy) {
            onClickCopy();
          }
          handleCopy(text);
        }}
      >
        {copied ? t('copiedExclamation') : t('copyToClipboard')}
      </ButtonSecondary>
    </Box>
  );
}

ExportTextContainer.propTypes = {
  text: PropTypes.string,
  onClickCopy: PropTypes.func,
};

export default React.memo(ExportTextContainer);
