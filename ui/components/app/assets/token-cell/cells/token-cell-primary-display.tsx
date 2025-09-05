import React from 'react';
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
import { useFormatters } from '../../../../../helpers/formatters';

type TokenCellPrimaryDisplayProps = {
  token: TokenFiatDisplayInfo;
  privacyMode: boolean;
};

export const TokenCellPrimaryDisplay = React.memo(
  ({ token, privacyMode }: TokenCellPrimaryDisplayProps) => {
    const { formatTokenWithMinThreshold } = useFormatters();

    return (
      <SensitiveText
        data-testid="multichain-token-list-item-value"
        color={TextColor.textAlternative}
        variant={TextVariant.bodySmMedium}
        textAlign={TextAlign.End}
        isHidden={privacyMode}
        length={SensitiveTextLength.Short}
      >
        {formatTokenWithMinThreshold(token.balance ?? 0, token.symbol)}
      </SensitiveText>
    );
  },
  (prevProps, nextProps) =>
    prevProps.token.primary === nextProps.token.primary &&
    prevProps.privacyMode === nextProps.privacyMode,
);
