import React, { useEffect, useRef, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Popover,
  PopoverPosition,
} from '../../../../component-library';
import { TokenWithBalance } from '../asset-list';
import { useAccountTotalFiatBalance } from '../../../../../hooks/useAccountTotalFiatBalance';
import {
  getConfirmationExchangeRates,
  getCurrentCurrency,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../../../../../selectors';
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

type AssetListControlBarProps = {
  tokenList: TokenWithBalance[];
  setTokenList: (arg: TokenWithBalance[]) => void;
  setLoading: (arg: boolean) => void;
  sorted: boolean;
  setSorted: (arg: boolean) => void;
};

const AssetListControlBar = ({
  tokenList,
  setTokenList,
  setLoading,
  sorted,
  setSorted,
}: AssetListControlBarProps) => {
  const controlBarRef = useRef<HTMLDivElement>(null); // Create a ref
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  // tokenExchangeRate
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const confirmationExchangeRates = useSelector(getConfirmationExchangeRates);
  const mergedRates = {
    ...contractExchangeRates,
    ...confirmationExchangeRates,
  };
  const accountTotalFiatBalance = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );

  const { loading } = accountTotalFiatBalance;

  useEffect(() => {
    if (!sorted) {
      setLoading(loading);
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

      setTokenList(tokensWithBalances);
      setLoading(loading);
    }
  }, [accountTotalFiatBalance]);

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
        <ButtonBase
          size={ButtonBaseSize.Sm}
          startIconName={IconName.Add}
          backgroundColor={
            isPopoverOpen
              ? BackgroundColor.backgroundPressed
              : BackgroundColor.backgroundDefault
          }
          borderColor={BorderColor.borderMuted}
          borderStyle={BorderStyle.solid}
          color={TextColor.textDefault}
        >
          Import
        </ButtonBase>
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
          />
        </Popover>
      </Box>
    </>
  );
};

export default AssetListControlBar;
