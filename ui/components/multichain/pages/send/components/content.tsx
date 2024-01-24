import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '../../../../component-library';
import { getSendHexDataFeatureFlagState } from '../../../../../ducks/metamask/metamask';
import {
  GAS_INPUT_MODES,
  getGasInputMode,
  getGasLimit,
  getGasPrice,
  getIsBalanceInsufficient,
  getMinimumGasLimitForSend,
  getSendAsset,
} from '../../../../../ducks/send';
import AdvancedGasInputs from '../../../../app/advanced-gas-inputs';
import { ConfirmGasDisplay } from '../../../../app/confirm-gas-display';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { hexToDecimal } from '../../../../../../shared/modules/conversion.utils';
import {
  setCustomGasLimit,
  setCustomGasPrice,
} from '../../../../../ducks/gas/gas.duck';
import { AssetPickerAmount } from '../../..';
import { SendHexData, SendPageRow } from '.';

export const SendPageContent = () => {
  // Hex data
  const showHexDataFlag = useSelector(getSendHexDataFeatureFlagState);
  const asset = useSelector(getSendAsset);
  const showHexData =
    showHexDataFlag &&
    asset &&
    asset.type !== AssetType.token &&
    asset.type !== AssetType.NFT;

  // Gas data
  const dispatch = useDispatch();
  const gasPrice = useSelector(getGasPrice);
  const gasLimit = useSelector(getGasLimit);
  const minimumGasLimitForSend = useSelector(getMinimumGasLimitForSend);
  const minimumGasLimit = hexToDecimal(minimumGasLimitForSend);

  const gasInputMode = useSelector(getGasInputMode);
  const insufficientBalance = useSelector(getIsBalanceInsufficient);

  const updateGasPrice = (newGasPrice: string) => {
    dispatch(updateGasPrice(newGasPrice));
    dispatch(setCustomGasPrice(newGasPrice));
  };

  const updateGasLimit = (newLimit: string) => {
    dispatch(updateGasLimit(newLimit));
    dispatch(setCustomGasLimit(newLimit));
  };

  return (
    <Box>
      <SendPageRow>
        <AssetPickerAmount />
      </SendPageRow>
      {showHexData ? <SendHexData /> : null}
      {gasInputMode === GAS_INPUT_MODES.INLINE ? (
        <SendPageRow>
          <AdvancedGasInputs
            updateCustomGasPrice={updateGasPrice}
            updateCustomGasLimit={updateGasLimit}
            customGasPrice={gasPrice}
            customGasLimit={gasLimit}
            insufficientBalance={insufficientBalance}
            minimumGasLimit={minimumGasLimit}
            customPriceIsSafe
            isSpeedUp={false}
          />
        </SendPageRow>
      ) : null}
      <SendPageRow>
        <ConfirmGasDisplay />
      </SendPageRow>
    </Box>
  );
};
