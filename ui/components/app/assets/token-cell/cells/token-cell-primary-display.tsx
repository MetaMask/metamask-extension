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

type TokenCellPrimaryDisplayProps = {
  token: TokenFiatDisplayInfo;
  privacyMode: boolean;
};

export const TokenCellPrimaryDisplay = React.memo(
  ({ token, privacyMode }: TokenCellPrimaryDisplayProps) => {
    const anyEnabledNetworksAreAvailable = useSelector(
      selectAnyEnabledNetworksAreAvailable,
    );

    return (
      <Skeleton
        isLoading={
          !anyEnabledNetworksAreAvailable && isZeroAmount(token.primary)
        }
        scaleY={0.8}
      >
        <SensitiveText
          data-testid="multichain-token-list-item-value"
          color={TextColor.textAlternative}
          variant={TextVariant.bodySmMedium}
          textAlign={TextAlign.End}
          isHidden={privacyMode}
          length={SensitiveTextLength.Short}
        >
          {token.primary} {token.symbol}
        </SensitiveText>
      </Skeleton>
    );
  },
  (prevProps, nextProps) =>
    prevProps.token.primary === nextProps.token.primary &&
    prevProps.privacyMode === nextProps.privacyMode,
);
