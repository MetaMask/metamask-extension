import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { ButtonSecondary, Text, Box } from '../../component-library';

function ExportTextContainer({ text = '', onClickCopy = null }) {
  const ONE_MINUTE = 1000 * 60;
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard(ONE_MINUTE);

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      borderColor={BorderColor.borderDefault}
      borderRadius={BorderRadius.MD}
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
