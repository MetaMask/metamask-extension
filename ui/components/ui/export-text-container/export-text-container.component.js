import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import {
  ALIGN_ITEMS,
  BORDER_COLORS,
  BORDER_RADIUS,
  DISPLAY,
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
import Box from '../box/box';
import { ButtonSecondary, Text, TEXT_VARIANTS } from '../../component-library';

function ExportTextContainer({ text = '', onClickCopy = null }) {
  const ONE_MINUTE = 1000 * 60;
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard(ONE_MINUTE);

  return (
    <Box
      display={DISPLAY.FLEX}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      flexDirection={FLEX_DIRECTION.COLUMN}
      alignItems={ALIGN_ITEMS.CENTER}
      borderColor={BORDER_COLORS.BORDER_DEFAULT}
      borderRadius={BORDER_RADIUS.MD}
      padding={4}
      gap={4}
    >
      <Text
        display={DISPLAY.FLEX}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        className="notranslate"
        variant={TEXT_VARIANTS.BODY_LG}
      >
        {text}
      </Text>
      <ButtonSecondary
        className="export-text-container__button"
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
