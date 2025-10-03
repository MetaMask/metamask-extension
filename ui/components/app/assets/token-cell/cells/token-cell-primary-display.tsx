import React from 'react';
import { useSelector } from 'react-redux';
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
import { Skeleton } from '../../../../component-library/skeleton';
import { selectAnyEnabledNetworksAreAvailable } from '../../../../../selectors';
import { isZeroAmount } from '../../../../../helpers/utils/number-utils';
import { useFormatters } from '../../../../../hooks/useFormatters';

type TokenCellPrimaryDisplayProps = {
  token: TokenFiatDisplayInfo;
  privacyMode: boolean;
};

export const TokenCellPrimaryDisplay = React.memo(
  ({ token, privacyMode }: TokenCellPrimaryDisplayProps) => {
    const { formatTokenQuantity } = useFormatters();
    const anyEnabledNetworksAreAvailable = useSelector(
      selectAnyEnabledNetworksAreAvailable,
    );

    return (
      <Skeleton
        isLoading={
          !anyEnabledNetworksAreAvailable && isZeroAmount(token.balance)
        }
      >
        <SensitiveText
          data-testid="multichain-token-list-item-value"
          color={TextColor.textAlternative}
          variant={TextVariant.bodySmMedium}
          textAlign={TextAlign.End}
          isHidden={privacyMode}
          length={SensitiveTextLength.Short}
        >
          {formatTokenQuantity(Number(token.balance ?? 0), token.symbol)}
        </SensitiveText>
      </Skeleton>
    );
  },
  (prevProps, nextProps) =>
    prevProps.token.balance === nextProps.token.balance &&
    prevProps.privacyMode === nextProps.privacyMode,
);
