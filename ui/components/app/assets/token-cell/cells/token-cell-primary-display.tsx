import React from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  SensitiveText,
  SensitiveTextLength,
} from '../../../../component-library';
import { TokenFiatDisplayInfo } from '../../types';
import { formatWithThreshold } from '../../util/formatWithThreshold';
import { getIntlLocale } from '../../../../../ducks/locale/locale';

type TokenCellPrimaryDisplayProps = {
  token: TokenFiatDisplayInfo;
  privacyMode: boolean;
};

export const TokenCellPrimaryDisplay = React.memo(
  ({ token, privacyMode }: TokenCellPrimaryDisplayProps) => {
    const locale = useSelector(getIntlLocale);

    const bnPrimary = new BigNumber(token.primary);
    const formattedPrimary = formatWithThreshold(
      bnPrimary.toNumber(),
      0.00001,
      locale,
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 5,
      },
    );
    return (
      <SensitiveText
        data-testid="multichain-token-list-item-value"
        color={TextColor.textAlternative}
        variant={TextVariant.bodySmMedium}
        textAlign={TextAlign.End}
        isHidden={privacyMode}
        length={SensitiveTextLength.Short}
      >
        {formattedPrimary} {token.symbol}
      </SensitiveText>
    );
  },
  (prevProps, nextProps) =>
    prevProps.token.primary === nextProps.token.primary &&
    prevProps.privacyMode === nextProps.privacyMode,
);
