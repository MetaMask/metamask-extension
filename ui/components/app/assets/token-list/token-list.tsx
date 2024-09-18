import React, { ReactNode } from 'react';
import TokenCell from '../token-cell';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Box } from '../../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { TokenWithBalance } from '../asset-list/asset-list';

type TokenListProps = {
  onTokenClick: (arg: string) => void;
  nativeToken: ReactNode;
  tokens: TokenWithBalance[];
  loading: boolean;
};

export default function TokenList({
  onTokenClick,
  nativeToken,
  tokens,
  loading = false,
}: TokenListProps) {
  const t = useI18nContext();

  if (loading) {
    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        padding={7}
        data-testid="token-list-loading-message"
      >
        {t('loadingTokens')}
      </Box>
    );
  }

  return (
    <div>
      {tokens.map((tokenData, index) => {
        if (tokenData?.isNative) {
          // we need cloneElement so that we can pass the unique key
          return React.cloneElement(nativeToken as React.ReactElement, {
            key: index,
          });
        }
        return <TokenCell key={index} {...tokenData} onClick={onTokenClick} />;
      })}
    </div>
  );
}
