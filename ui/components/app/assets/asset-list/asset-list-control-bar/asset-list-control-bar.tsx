import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Popover,
  PopoverPosition,
} from '../../../../component-library';
import { TokenWithBalance } from '../asset-list';
import {
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
} from '../../../../../selectors';
import SortControl from '../sort-control';
import {
  BackgroundColor,
  BorderColor,
  BorderStyle,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { sortAssets } from '../../util/sort';
import { useNativeTokenBalance } from '../native-token/use-native-token-balance';
import ImportControl from '../import-control';
import { useAccountTotalFiatBalance } from '../../../../../hooks/useAccountTotalFiatBalance';

type AssetListControlBarProps = {
  tokenList: TokenWithBalance[];
  setTokenList: (arg: TokenWithBalance[]) => void;
  showTokensLinks?: boolean;
};

const AssetListControlBar = ({
  tokenList,
  setTokenList,
  showTokensLinks,
}: AssetListControlBarProps) => {
  const [sorted, setSorted] = useState(false);
  const controlBarRef = useRef<HTMLDivElement>(null); // Create a ref
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenSortConfig = useSelector((state: any) => {
    return state.metamask.preferences.tokenSortConfig;
  });
  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const { tokensWithBalances, loading } = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  ) as {
    tokensWithBalances: TokenWithBalance[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergedRates: any;
    loading: boolean;
  };

  const { primaryBalance, secondaryBalance, tokenSymbol, primaryTokenImage } =
    useNativeTokenBalance();

  const nativeTokenWithBalance: TokenWithBalance = {
    address: '',
    symbol: tokenSymbol || '',
    string: primaryBalance,
    image: primaryTokenImage,
    tokenFiatAmount: secondaryBalance,
    isNative: true,
  };

  const handleSort = () => {
    if (!sorted) {
      if (tokenSortConfig) {
        const sortedTokenList = sortAssets(
          [nativeTokenWithBalance, ...tokensWithBalances],
          tokenSortConfig,
        );
        setTokenList(sortedTokenList);
      } else {
        setTokenList([nativeTokenWithBalance, ...tokensWithBalances]);
      }
    }
  };

  useEffect(() => {
    handleSort();
  }, [tokenSortConfig, loading, tokensWithBalances.length]);

  const handleOpenPopover = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  return (
    <>
      <Box className="asset-list-control-bar" ref={controlBarRef}>
        <ButtonBase
          onClick={handleOpenPopover}
          size={ButtonBaseSize.Sm}
          endIconName={IconName.ArrowDown}
          backgroundColor={
            isPopoverOpen
              ? BackgroundColor.backgroundPressed
              : BackgroundColor.backgroundDefault
          }
          borderColor={BorderColor.borderMuted}
          borderStyle={BorderStyle.solid}
          color={TextColor.textDefault}
        >
          Sort By
        </ButtonBase>
        <ImportControl showTokensLinks={showTokensLinks} />
        <Popover
          isOpen={isPopoverOpen}
          position={PopoverPosition.BottomStart}
          referenceElement={controlBarRef.current}
          matchWidth={true}
          style={{
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
          }}
        >
          <SortControl
            tokenList={tokenList}
            setTokenList={setTokenList}
            setSorted={setSorted}
            sorted={sorted}
          />
        </Popover>
      </Box>
    </>
  );
};

export default AssetListControlBar;
