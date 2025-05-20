import React from 'react';
import {
  TextVariant,
  TextAlign,
} from '../../../../../helpers/constants/design-system';
import {
  SensitiveText,
  SensitiveTextLength,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export function DeFiSymbolGroup({
  symbols,
  privacyMode = false,
}: {
  symbols: string[];
  privacyMode?: boolean;
}) {
  const t = useI18nContext();

  const buildSymbolGroup = (symbols: string[]): string => {
    if (symbols.length === 1) {
      return `${symbols[0]} only`;
    }

    if (symbols.length === 2) {
      return `${symbols[0]} +${symbols.length - 1} ${t('other')}`;
    }

    if (symbols.length > 2) {
      return `${symbols[0]} +${symbols.length - 1} ${t('others')}`;
    }
    return '';
  };

  const symbolGroup = buildSymbolGroup(symbols);

  return (
    <SensitiveText
      variant={TextVariant.bodyMd}
      textAlign={TextAlign.End}
      data-testid="defi-list-symbol-group"
      isHidden={privacyMode}
      length={SensitiveTextLength.Medium}
    >
      {symbolGroup}
    </SensitiveText>
  );
}
