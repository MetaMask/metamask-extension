import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import Box from '../box';
import { Button, BUTTON_TYPES, Text, HelpText } from '../../component-library';
import {
  ALIGN_ITEMS,
  BORDER_RADIUS,
  COLORS,
  DISPLAY,
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
  TEXT,
} from '../../../helpers/constants/design-system';

function ExportTextContainer({ text = '', onClickCopy = null }) {
  const ONE_MINUTE = 1000 * 60;
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard(ONE_MINUTE);

  return (
    <div className="export-text-container">
      <Box
        display={DISPLAY.FLEX}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        flexDirection={FLEX_DIRECTION.COLUMN}
        alignItems={ALIGN_ITEMS.CENTER}
        borderRadius={BORDER_RADIUS.MD}
        borderColor={COLORS.BORDER_DEFAULT}
        padding={4}
      >
        <Text variant={TEXT.BODY_LG_MEDIUM} marginBottom={4}>
          {text}
        </Text>
        <Button
          onClick={() => {
            if (onClickCopy) {
              onClickCopy();
            }
            handleCopy(text);
          }}
          type={BUTTON_TYPES.SECONDARY}
        >
          {copied ? t('copied') : t('copyToClipboard')}
        </Button>
      </Box>
      {copied ? (
        <HelpText color={COLORS.SUCCESS_DEFAULT}>
          {t('copiedExclamation')}
        </HelpText>
      ) : null}
    </div>
  );
}

ExportTextContainer.propTypes = {
  text: PropTypes.string,
  onClickCopy: PropTypes.func,
};

export default React.memo(ExportTextContainer);
