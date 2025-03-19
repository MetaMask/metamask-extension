import React from 'react';
import { isString } from 'lodash';
import { Text } from '../../../../../../components/component-library';
import { TextStyleUtilityProps } from '../../../../../../components/component-library/text';
import Tooltip from '../../../../../../components/ui/tooltip';
import { TextColor } from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';

type SafeUnicodeTextProps = {
  text: string;
  style?: React.CSSProperties;
} & TextStyleUtilityProps;

/**
 * Hidden unicode characters that we want to display.
 * The following characters are allowed:
 * - Line separator (\n)
 * - Paragraph separator (\r)
 */
const UNICODE_CODES = new Set([
  // 10, // Line separator (\n) - allowed
  // 13, // Paragraph separator (\r) - allowed

  // TODO: Verify
  0xfeff, // Byte Order Mark (BOM)
  0x061c, // Arabic Letter Mark (ALM)
  0x180e, // Mongolian Vowel Separator (MVS)

  0x2060, // Word Joiner
  0x2062, // Invisible Times
  0x2063, // Invisible Separator
  0x2064, // Invisible Plus
  0xffa0, // Halfwidth Hangul Filler
  0x1160, // Hangul Jungseong Filler
  0x3164, // Hangul Filler
]);

// TODO: Verify
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

function renderCharacter(
  char: string,
  index: number,
  t: ReturnType<typeof useI18nContext>,
): React.ReactElement {
  const code = char.codePointAt(0);

  if (code !== undefined && isSpecialHiddenCode(code)) {
    return (
      <Tooltip
        key={index}
        position="top"
        title={t('safeUnicodeTextTooltipWarning')}
        style={{ display: 'inline', whiteSpace: 'pre-wrap' }}
        wrapperStyle={{ display: 'inline', whiteSpace: 'pre-wrap' }}
      >
        <Text
          color={TextColor.warningDefault}
          key={index}
          style={{ display: 'inline', whiteSpace: 'pre-wrap' }}
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
 *
 * @param {string} text - The text to render
 * @param {TextStyleUtilityProps} props - Additional Text component props
 * @returns {React.ReactElement}
 */

export default function SafeUnicodeText({
  text,
  style,
  ...props
}: SafeUnicodeTextProps) {
  const t = useI18nContext();

  if (!text || !isString(text)) {
    return null;
  }

  return (
    <Text style={{ whiteSpace: 'pre-wrap', ...style }} {...props}>
      {[...text].map((char, index) => renderCharacter(char, index, t))}
    </Text>
  );
}
