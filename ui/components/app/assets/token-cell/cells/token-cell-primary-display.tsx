import React from 'react';
// @ts-expect-error Need to configure this project to work with ESM imports
import { formatUnits } from 'viem/_cjs/utils/unit/formatUnits';
import { hexToBigInt } from 'viem/_cjs/utils/encoding/fromHex';
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
    const { formatTokenQuantity } = useFormatters();

    console.log('>>> TokenCellPrimaryDisplay', { token });

    let fromViem = '----';

    try {
      console.log(
        '>>> TEST 1',
        formatUnits(hexToBigInt(token.balanceRaw), token.decimals),
      );
      fromViem = formatUnits(hexToBigInt(token.balanceRaw), token.decimals);
    } catch (error) {
      console.log('>>> TEST 1 error', error);
    }

    // Use viem's formatUnits to convert from wei/raw units to human readable
    // const fromViem = formatUnits(BigInt(token.balance ?? 0), token.decimals);
    // console.log('>>> fromViem', { fromViem });

    const tokenAmount = formatTokenQuantity(
      fromViem,
      // token.primary,
      token.symbol,
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
        {tokenAmount}
      </SensitiveText>
    );
  },
  (prevProps, nextProps) =>
    prevProps.token.primary === nextProps.token.primary &&
    prevProps.privacyMode === nextProps.privacyMode,
);
