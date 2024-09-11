import React, { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import {
  Box,
  Button,
  ButtonSize,
  IconName,
  Popover,
  PopoverPosition,
} from '../../../../component-library';
import { TokenWithBalance } from '../asset-list';
import { SortOrder, sortAssets } from '../../util/sort';
import { useAccountTotalFiatBalance } from '../../../../../hooks/useAccountTotalFiatBalance';
import { shallowEqual, useSelector } from 'react-redux';
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

type AssetListControlBarProps = {
  tokenList: TokenWithBalance[];
  setTokenList: (arg: TokenWithBalance[]) => void;
  setLoading: (arg: boolean) => void;
};

const AssetListControlBar = ({
  tokenList,
  setTokenList,
  setLoading,
}: AssetListControlBarProps) => {
  const controlBarRef = useRef<HTMLDivElement>(null); // Create a ref
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const handleOpenPopover = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };
  return (
    <>
      <Box className="asset-list-control-bar" ref={controlBarRef}>
        <Button
          onClick={handleOpenPopover}
          size={ButtonSize.Sm}
          endIconName={IconName.ArrowDown}
        >
          Sort By
        </Button>
        <Button size={ButtonSize.Sm} startIconName={IconName.Add}>
          Import
        </Button>
        <Popover
          isOpen={true}
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
            setLoading={setLoading}
          />
        </Popover>
      </Box>
    </>
  );
};

export default AssetListControlBar;
