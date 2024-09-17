import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Popover,
  PopoverPosition,
} from '../../../../component-library';
import { TokenWithBalance } from '../asset-list';
import { getCurrentCurrency } from '../../../../../selectors';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../../../../../helpers/utils/util';
import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
import { getConversionRate } from '../../../../../ducks/metamask/metamask';
import { getTokenFiatAmount } from '../../../../../helpers/utils/token-util';
import SortControl from '../sort-control';
import {
  BackgroundColor,
  BorderColor,
  BorderStyle,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { sortAssets } from '../../util/sort';
import { useNativeTokenBalance } from '../native-token/use-native-token-balance';
import { useAccountTotalFiatBalancesHook } from './use-account-total-fiat-balances';
import { showImportTokensModal } from '../../../../../store/actions';
import ImportControl from '../import-control';

type AssetListControlBarProps = {
  tokenList: TokenWithBalance[];
  setTokenList: (arg: TokenWithBalance[]) => void;
  sorted: boolean;
  setSorted: (arg: boolean) => void;
};

const AssetListControlBar = ({
  tokenList,
  setTokenList,
  sorted,
  setSorted,
}: AssetListControlBarProps) => {
  const controlBarRef = useRef<HTMLDivElement>(null); // Create a ref
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenSortConfig = useSelector((state: any) => {
    return state.metamask.preferences.tokenSortConfig;
  });
  const { accountTotalFiatBalance, mergedRates } =
    useAccountTotalFiatBalancesHook();

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

  useEffect(() => {
    if (!sorted) {
      const tokensWithBalances =
        accountTotalFiatBalance.tokensWithBalances as TokenWithBalance[];

      tokensWithBalances.forEach((token) => {
        // token.string is the balance displayed in the TokenList UI
        token.string = roundToDecimalPlacesRemovingExtraZeroes(
          token.string,
          5,
        ) as string;
      });

      // to sort by fiat balance, we need to compute this at this level
      // should this get passed down as props to token-cell as props, rather than recomputing there?
      tokensWithBalances.forEach((token) => {
        const contractExchangeTokenKey = Object.keys(mergedRates).find((key) =>
          isEqualCaseInsensitive(key, token.address),
        );

        const tokenExchangeRate =
          contractExchangeTokenKey && mergedRates[contractExchangeTokenKey];

        token.tokenFiatAmount =
          getTokenFiatAmount(
            tokenExchangeRate,
            conversionRate,
            currentCurrency,
            token.string, // tokenAmount
            token.symbol, // tokenSymbol
            false, // no currency symbol prefix
            false, // no ticker symbol suffix
          ) || '0';
      });

      if (tokenSortConfig) {
        const sortedTokenList = sortAssets(
          [nativeTokenWithBalance, ...tokensWithBalances],
          tokenSortConfig,
        );
        setTokenList(sortedTokenList);
      } else {
        setTokenList(tokensWithBalances);
      }
    }
  }, [tokenSortConfig]);

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
        <ImportControl />
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
