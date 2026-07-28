import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { ApprovalDetails } from './approval-details';
import { BridgeDetails } from './bridge-details/bridge-details';
import { ConvertDetails } from './convert-details';
import { DefaultDetails } from './default-details';
import { NftDetails } from './nft-details';
import { PerpsDepositDetails } from './perps-deposit-details';
import { PerpsDetails } from './perps-details';
import { SendDetails } from './send-details';
import { SwapDetails } from './swap-details';
import { AssetActivationDetails } from './asset-activation-details';

type Props = {
  item: ActivityListItem | undefined;
};

export function TemplateLoader({ item }: Props) {
  if (!item) {
    return null;
  }

  switch (item.type) {
    case 'nftBuy':
    case 'nftMint':
    case 'nftSell':
      return <NftDetails item={item} />;
    case 'send':
    case 'receive':
      return <SendDetails item={item} />;
    case 'bridge':
      return <BridgeDetails item={item} />;
    case 'convert':
      return <ConvertDetails item={item} />;
    case 'swap':
    case 'lendingDeposit':
    case 'lendingWithdrawal':
    case 'wrap':
    case 'unwrap':
      return <SwapDetails item={item} />;
    case 'approveSpendingCap':
    case 'revokeSpendingCap':
    case 'increaseSpendingCap':
      return <ApprovalDetails item={item} />;
    case 'perpsAddFunds':
      return <PerpsDepositDetails item={item} />;
    case 'perpsWithdraw':
      return <PerpsDetails item={item} />;
    case 'assetActivation':
    case 'assetDeactivation':
      return <AssetActivationDetails item={item} />;
    default:
      return <DefaultDetails item={item} />;
  }
}
