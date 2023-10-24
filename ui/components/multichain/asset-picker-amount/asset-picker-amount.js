import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Box, Icon, IconName, IconSize } from '../../component-library';
import {
  BorderRadius,
  IconColor,
} from '../../../helpers/constants/design-system';

import { AssetType } from '../../../../shared/constants/transaction';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { getNativeCurrencyImage, getTokenList } from '../../../selectors';
import UserPreferencedCurrencyInput from '../../app/user-preferenced-currency-input/user-preferenced-currency-input.container';
import UserPreferencedTokenInput from '../../app/user-preferenced-token-input/user-preferenced-token-input.component';
import { getCurrentDraftTransaction } from '../../../ducks/send';
import { Numeric } from '../../../../shared/modules/Numeric';
import AssetPicker from './asset-picker/asset-picker';
import MaxClearButton from './max-clear-button/max-clear-button';

// A component that combines an asset picker with an input for the amount to send.
// Work in progress.
export default function AssetPickerAmount({
  asset,
  amount,
  inError,
  updateSendAmount,
}) {
  const transaction = useSelector(getCurrentDraftTransaction);
  const nativeCurrency = useSelector(getNativeCurrency);
  const nativeCurrencyImage = useSelector(getNativeCurrencyImage);
  const tokenList = useSelector(getTokenList);

  let balance = new Numeric(transaction.asset.balance, 16).toBase(10);
  if (asset.type === AssetType.native) {
    balance = balance.applyConversionRate(1 / Math.pow(10, 18));
  }

  // TODO: Handle really long symbols in the UI
  const symbol =
    asset.type === AssetType.native ? nativeCurrency : asset.details?.symbol;

  const image =
    asset.type === AssetType.native
      ? nativeCurrencyImage
      : asset.details.image ??
        tokenList?.[asset.details.address.toLowerCase()]?.iconUrl;

  return (
    // TODO: Error state when insufficient funds
    <div className="asset-picker-amount">
      <span className="asset-picker-amount__amount">Amount</span>
      <MaxClearButton />
      <Box className="asset-picker-amount__box" borderRadius={BorderRadius.LG}>
        <AssetPicker asset={{ symbol, image }} />

        {/* TODO: See if the native and token inputs can be merged into 1 component */}
        {asset.type === AssetType.native ? (
          <UserPreferencedCurrencyInput
            onChange={(newAmount) => updateSendAmount(newAmount)}
            hexValue={amount}
            error={inError}
            className="asset-picker-amount__input"
            swapIcon={(onClick) => (
              <Icon
                className="asset-picker-amount__swap-icon"
                name={IconName.SwapVertical}
                size={IconSize.Sm}
                color={IconColor.primaryDefault}
                onClick={onClick}
              />
            )}
          />
        ) : (
          <UserPreferencedTokenInput
            error={inError}
            onChange={(newAmount) => updateSendAmount(newAmount)}
            token={asset.details}
            value={amount}
            className="asset-picker-amount__input"
            // TODO: Make this support swapping currencies so you type fiat values.
            //       (But only when a conversion rate is available)
          />
        )}
      </Box>
      <span className="asset-picker-amount__balance">
        {/* TODO: Consider rounding the balance so its not super long? */}
        Balance: {balance.toString()} {symbol}
      </span>
    </div>
  );
}

AssetPickerAmount.propTypes = {
  asset: PropTypes.object,
  amount: PropTypes.string,
  inError: PropTypes.bool,
  updateSendAmount: PropTypes.func,
};
