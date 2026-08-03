import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { Header } from '../components/header';
import { ApprovalDetails } from './approval-details';
import { BridgeDetails } from './bridge-details/bridge-details';
import { ConvertDetails } from './convert-details';
import { DefaultDetails } from './default-details';
import { NftDetails } from './nft-details';
import { PerpsDepositDetails } from './perps-deposit-details';
import { PerpsDetails } from './perps-details';
import { useRampsDetailsItem } from './ramps/hooks';
import { RampOrderDetails } from './ramps/ramp-order-details';
import { SendDetails } from './send-details';
import { SwapDetails } from './swap-details';
import { AssetActivationDetails } from './asset-activation-details';

type Props = {
  item: ActivityListItem | undefined;
  chainId: string | undefined;
  txIdentifier: string | undefined;
  onBack: () => void;
};

export function TemplateLoader({ item, chainId, txIdentifier, onBack }: Props) {
  const rampsItem = useRampsDetailsItem(txIdentifier, chainId);
  const resolvedItem = rampsItem ?? item;

  let body: React.ReactNode = null;
  if (resolvedItem) {
    switch (resolvedItem.type) {
      case 'nftBuy':
      case 'nftMint':
      case 'nftSell':
        body = <NftDetails item={resolvedItem} />;
        break;
      case 'send':
      case 'receive':
        body = <SendDetails item={resolvedItem} />;
        break;
      case 'bridge':
        body = <BridgeDetails item={resolvedItem} />;
        break;
      case 'convert':
        body = <ConvertDetails item={resolvedItem} />;
        break;
      case 'swap':
      case 'lendingDeposit':
      case 'lendingWithdrawal':
      case 'wrap':
      case 'unwrap':
        body = <SwapDetails item={resolvedItem} />;
        break;
      case 'approveSpendingCap':
      case 'revokeSpendingCap':
      case 'increaseSpendingCap':
        body = <ApprovalDetails item={resolvedItem} />;
        break;
      case 'perpsAddFunds':
        body = <PerpsDepositDetails item={resolvedItem} />;
        break;
      case 'perpsWithdraw':
        body = <PerpsDetails item={resolvedItem} />;
        break;
      case 'assetActivation':
      case 'assetDeactivation':
        body = <AssetActivationDetails item={resolvedItem} />;
        break;
      case 'rampBuy':
      case 'rampSell':
        body = <RampOrderDetails item={resolvedItem} />;
        break;
      default:
        body = <DefaultDetails item={resolvedItem} />;
    }
  }

  return (
    <>
      <div className="shrink-0 px-4 py-4">
        <Header item={resolvedItem} onBack={onBack} />
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto px-4 pb-4">
        {body}
      </div>
    </>
  );
}
