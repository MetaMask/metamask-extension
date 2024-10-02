import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  getPreferences,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../../../../../selectors';
import SortControl from '../sort-control';
import {
  BackgroundColor,
  BorderColor,
  BorderStyle,
  Display,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { sortAssets } from '../../util/sort';
import { useNativeTokenBalance } from '../native-token/use-native-token-balance';
import ImportControl from '../import-control';
import { useAccountTotalFiatBalance } from '../../../../../hooks/useAccountTotalFiatBalance';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../../../shared/constants/app';
import { getConversionRate } from '../../../../../ducks/metamask/metamask';

type AssetListControlBarProps = {
  setTokenList: (arg: TokenWithBalance[]) => void;
  showTokensLinks?: boolean;
};

const AssetListControlBar = ({
  setTokenList,
  showTokensLinks,
}: AssetListControlBarProps) => {
  const t = useI18nContext();
  const controlBarRef = useRef<HTMLDivElement>(null); // Create a ref
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { tokenSortConfig } = useSelector(getPreferences);

  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const conversionRate = useSelector(getConversionRate);

  const { tokensWithBalances } = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  ) as {
    tokensWithBalances: TokenWithBalance[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergedRates: any;
    loading: boolean;
  };

  const nativeTokenWithBalance = useNativeTokenBalance();

  const windowType = getEnvironmentType();
  const isFullScreen =
    windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
    windowType !== ENVIRONMENT_TYPE_POPUP;

  // Memoized check to determine if we can sort tokens market data. helps to address race condition:
  // After switching accounts, there is a state when we don't yet have all exchange rates, but we have tokens
  // this results in not all tokenBalances being updated correctly at the time when we need to render sort by declining fiatBalance
  const tokensHaveMarketData = useMemo(() => {
    return tokensWithBalances
      .map((token) => token.address)
      .every((contract) =>
        Object.keys(contractExchangeRates).includes(contract),
      );
  }, [tokensWithBalances, contractExchangeRates]);

  useEffect(() => {
    const sortedTokenList = sortAssets(
      [nativeTokenWithBalance, ...tokensWithBalances],
      tokenSortConfig,
    );
    setTokenList(sortedTokenList);
  }, [
    tokenSortConfig,
    tokensHaveMarketData,
    tokensWithBalances,
    conversionRate,
    contractExchangeRates,
  ]);

  const handleOpenPopover = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  return (
    <>
      <Box
        className="asset-list-control-bar"
        ref={controlBarRef}
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        marginLeft={4}
        marginRight={4}
        paddingTop={4}
      >
        <ButtonBase
          data-testid="sort-by-popover-toggle"
          className="asset-list-control-bar__button"
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
          {t('sortBy')}
        </ButtonBase>
        <ImportControl showTokensLinks={showTokensLinks} />
        <Popover
          onClickOutside={closePopover}
          isOpen={isPopoverOpen}
          position={PopoverPosition.BottomStart}
          referenceElement={controlBarRef.current}
          matchWidth={!isFullScreen}
          style={{
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            minWidth: isFullScreen ? '325px' : '',
          }}
        >
          <SortControl handleClose={closePopover} />
        </Popover>
      </Box>
    </>
  );
};

export default AssetListControlBar;
