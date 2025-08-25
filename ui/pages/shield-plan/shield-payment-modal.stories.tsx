import React from 'react';
import { ShieldPaymentModal } from './shield-payment-modal';
import { PAYMENT_METHODS } from './types';
import { AssetType } from '../../../shared/constants/transaction';
import { AssetPickerModal } from '../../components/multichain/asset-picker-amount/asset-picker-modal';

export default {
  title: 'Components/UI/ShieldPlan/ShieldPaymentModal',
  component: ShieldPaymentModal,
};

export const DefaultStory = () => {
  const paymentTokens = [
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'USDC',
      image:
        'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194',
      type: AssetType.token,
      chainId: '0x1',
    },
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'USDT',
      image:
        'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194',
      type: AssetType.token,
      chainId: '0x1',
    },
  ] as unknown as (keyof typeof AssetPickerModal)['customTokenListGenerator'];

  return (
    <div style={{ maxHeight: '2000px' }}>
      <ShieldPaymentModal
        isOpen
        onClose={() => {}}
        selectedPaymentMethod={PAYMENT_METHODS.TOKEN}
        setSelectedPaymentMethod={() => {}}
        selectedToken={paymentTokens[0]}
        onAssetChange={() => {}}
        paymentTokens={paymentTokens}
      />
    </div>
  );
};

DefaultStory.storyName = 'Default';
