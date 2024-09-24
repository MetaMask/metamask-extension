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
  getPreferences,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
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

  const { useNativeCurrencyAsPrimaryCurrency, tokenSortConfig } =
    useSelector(getPreferences);

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

  const nativeTokenWithBalance = useNativeTokenBalance();

  useEffect(() => {
    // this swap is needed when toggling primary currency type for native token in order to sort by tokenFiatAmount only
    if (useNativeCurrencyAsPrimaryCurrency) {
      [nativeTokenWithBalance.string, nativeTokenWithBalance.tokenFiatAmount] =
        [nativeTokenWithBalance.tokenFiatAmount, nativeTokenWithBalance.string];
    }

    const sortedTokenList = sortAssets(
      [nativeTokenWithBalance, ...tokensWithBalances],
      tokenSortConfig || {
        key: 'tokenFiatAmount',
        order: 'dsc',
        sortCriteria: 'stringNumeric',
      },
    );

    setTokenList(sortedTokenList);
  }, [tokenSortConfig?.key, loading, tokensWithBalances.length]);

  const handleOpenPopover = () => {
    setIsPopoverOpen(!isPopoverOpen);
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
          <SortControl />
        </Popover>
      </Box>
    </>
  );
};

export default AssetListControlBar;
