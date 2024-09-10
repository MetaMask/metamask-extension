import BigNumber from 'bignumber.js';
import { NativeAsset } from '/Users/montelai/consensys/metamask-extension-new/ui/components/multichain/asset-picker-amount/asset-picker-modal/types';

export const convertUnitToHighestDenomination = ({
  asset,
  amount,
}: {
  asset: NativeAsset & {
    balance: string;
    details: { decimals: number };
  };
  amount: string;
}): string => {
  const decimals = new BigNumber(10).pow(asset.details.decimals);
  const amountInHighestDenomination = new BigNumber(amount).div(decimals);

  return amountInHighestDenomination.toString();
};
