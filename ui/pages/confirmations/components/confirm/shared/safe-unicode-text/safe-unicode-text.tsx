import React from 'react';
import { isString } from 'lodash';
import { t } from '../../../../../../../app/scripts/translate';
import { Text } from '../../../../../../components/component-library';
import { TextStyleUtilityProps } from '../../../../../../components/component-library/text';
import Tooltip from '../../../../../../components/ui/tooltip';
import { TextColor } from '../../../../../../helpers/constants/design-system';

interface SafeUnicodeTextProps extends TextStyleUtilityProps {
  text: string;
  style?: React.CSSProperties;
}

const UNICODE_CODES = new Set([
  0x2028,         // Line separator
  10,             // Line separator (\n)
  0x2029,         // Paragraph separator
  13,             // Paragraph separator (\r)
  0xfeff,         // Byte Order Mark (BOM)
  0x061C,         // Arabic Letter Mark (ALM)
  0x180E,         // Mongolian Vowel Separator (MVS)
]);

const UNICODE_RANGES = {
  ZERO_WIDTH_MARKERS: { start: 0x200b, end: 0x200f }, // includes RTL, LTR markers
  DIRECTIONAL_CONTROLS: { start: 0x202a, end: 0x202e },
  FORMATTING: { start: 0x2066, end: 0x2069 },
  PRIVATE_USE: { start: 0xe000, end: 0xf8ff },
  INVISIBLE_TAGS: { start: 0xe0020, end: 0xe007f },

  // todo: double check
  VARIATION_SELECTORS: { start: 0xfe00, end: 0xfe0f },
  INTERLINEARS: { start: 0xfff9, end: 0xfffb },
};

const isCodeInRange = (code: number, range: { start: number; end: number }) => {
  return code >= range.start && code <= range.end;
};

const isSpecialHiddenCode = (code: number) => {
  return (
    Object.values(UNICODE_RANGES).some((range) => isCodeInRange(code, range)) ||
    UNICODE_CODES.has(code)
  );
};

const formatCodePoint = (code: number) => {
  return `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
};

function renderCharacter(char: string, index: number): React.ReactElement {
  const code = char.codePointAt(0);

  if (code !== undefined && isSpecialHiddenCode(code)) {
    return (
      <Tooltip
        key={index}
        position="top"
        title={t('safeUnicodeTextTooltipWarning')}
        style={{ display: 'inline' }}
        wrapperStyle={{ display: 'inline' }}
      >
        <Text
          color={TextColor.warningDefault}
          key={index}
          style={{ display: 'inline' }}
        >
          {formatCodePoint(code)}
        </Text>
      </Tooltip>
    );
  }

  return <React.Fragment key={index}>{char}</React.Fragment>;
}

/**
 * Renders text with decoded hidden unicode characters and tooltip warnings
 * @param {string} text - The text to render
 * @param {TextStyleUtilityProps} props - Additional Text component props
 * @returns {React.ReactElement}
 */

export default function SafeUnicodeText({
  text,
  ...props
}: SafeUnicodeTextProps) {
  if (!text || !isString(text)) {
    return null;
  }

  return <Text {...props}>{[...text].map(renderCharacter)}</Text>;
}
