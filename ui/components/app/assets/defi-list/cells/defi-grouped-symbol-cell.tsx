import React from 'react';
import {
  TextVariant,
  TextAlign,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import {
  SensitiveText,
  SensitiveTextLength,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function DeFiSymbolGroup({
  symbols,
  privacyMode = false,
}: {
  symbols: string[];
  privacyMode?: boolean;
}) {
  const t = useI18nContext();

  const buildSymbolGroup = (defiSymbols: string[]): string => {
    if (defiSymbols.length === 1) {
      return `${defiSymbols[0]} ${t('only')}`;
    }

    if (defiSymbols.length === 2) {
      return `${defiSymbols[0]} +${defiSymbols.length - 1} ${t('other')}`;
    }

    if (defiSymbols.length > 2) {
      return `${defiSymbols[0]} +${defiSymbols.length - 1} ${t('others')}`;
    }
    return '';
  };

  const symbolGroup = buildSymbolGroup(symbols);

  return (
    <SensitiveText
      color={TextColor.textAlternative}
      variant={TextVariant.bodySmMedium}
      textAlign={TextAlign.End}
      data-testid="defi-list-symbol-group"
      isHidden={privacyMode}
      length={SensitiveTextLength.Medium}
    >
      {symbolGroup}
    </SensitiveText>
  );
}
