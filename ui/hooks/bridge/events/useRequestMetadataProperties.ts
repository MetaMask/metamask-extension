/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
import { BRIDGE_DEFAULT_SLIPPAGE } from '@metamask/bridge-controller';
import {
  getIsBridgeTx,
  getQuoteRequest,
} from '../../../ducks/bridge/selectors';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { getCurrentKeyring } from '../../../selectors';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import { ActionType } from './types';
import { useConvertedUsdAmounts } from './useConvertedUsdAmounts';

export const useRequestMetadataProperties = () => {
  const { slippage } = useSelector(getQuoteRequest);
  const isBridgeTx = useSelector(getIsBridgeTx);
  const stx_enabled = useSelector(getIsSmartTransaction);
  const { usd_amount_source } = useConvertedUsdAmounts();

  const keyring = useSelector(getCurrentKeyring);
  // @ts-expect-error keyring type is possibly wrong
  const is_hardware_wallet = isHardwareKeyring(keyring.type) ?? false;

  const slippage_limit = slippage;
  const swap_type = isBridgeTx
    ? ActionType.CROSSCHAIN_V1
    : ActionType.SWAPBRIDGE_V1;
  const custom_slippage = slippage_limit !== BRIDGE_DEFAULT_SLIPPAGE;

  return {
    slippage_limit: slippage ?? BRIDGE_DEFAULT_SLIPPAGE,
    custom_slippage,
    is_hardware_wallet,
    swap_type,
    stx_enabled,
    usd_amount_source,
  };
};
