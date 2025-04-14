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
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const stx_enabled = useSelector(getIsSmartTransaction);
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { usd_amount_source } = useConvertedUsdAmounts();

  const keyring = useSelector(getCurrentKeyring);
  // @ts-expect-error keyring type is possibly wrong
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const is_hardware_wallet = isHardwareKeyring(keyring.type) ?? false;

  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const slippage_limit = slippage;
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const swap_type = isBridgeTx
    ? ActionType.CROSSCHAIN_V1
    : ActionType.SWAPBRIDGE_V1;
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const custom_slippage = slippage_limit !== BRIDGE_DEFAULT_SLIPPAGE;

  return {
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    slippage_limit: slippage ?? BRIDGE_DEFAULT_SLIPPAGE,
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    custom_slippage,
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    is_hardware_wallet,
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    swap_type,
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    stx_enabled,
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_amount_source,
  };
};
