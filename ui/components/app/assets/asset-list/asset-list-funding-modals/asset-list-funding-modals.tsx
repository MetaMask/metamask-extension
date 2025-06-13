import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { ReceiveModal } from '../../../../multichain';
import { FundingMethodModal } from '../../../../multichain/funding-method-modal/funding-method-modal';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getSelectedAccount } from '../../../../../selectors';
import {
  getMultichainIsBitcoin,
  getMultichainSelectedAccountCachedBalanceIsZero,
} from '../../../../../selectors/multichain';
import { getIsNativeTokenBuyable } from '../../../../../ducks/ramps';
import { RampsCard } from '../../../../multichain/ramps-card';
import { RAMPS_CARD_VARIANT_TYPES } from '../../../../multichain/ramps-card/ramps-card';

const AssetListFundingModals = () => {
  const t = useI18nContext();
  const selectedAccount = useSelector(getSelectedAccount);

  const [showFundingMethodModal, setShowFundingMethodModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const onClickReceive = () => {
    setShowFundingMethodModal(false);
    setShowReceiveModal(true);
  };

  const balanceIsZero = useSelector(
    getMultichainSelectedAccountCachedBalanceIsZero,
  );
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const shouldShowBuy = isBuyableChain && balanceIsZero;
  const isBtc = useSelector(getMultichainIsBitcoin);

  return (
    <>
      {shouldShowBuy ? (
        <RampsCard
          variant={
            isBtc
              ? RAMPS_CARD_VARIANT_TYPES.BTC
              : RAMPS_CARD_VARIANT_TYPES.TOKEN
          }
          handleOnClick={
            isBtc ? undefined : () => setShowFundingMethodModal(true)
          }
        />
      ) : null}
      {showReceiveModal && selectedAccount?.address && (
        <ReceiveModal
          address={selectedAccount.address}
          onClose={() => setShowReceiveModal(false)}
        />
      )}
      {showFundingMethodModal && (
        <FundingMethodModal
          isOpen={showFundingMethodModal}
          onClose={() => setShowFundingMethodModal(false)}
          title={t('fundingMethod')}
          onClickReceive={onClickReceive}
        />
      )}
    </>
  );
};

export default AssetListFundingModals;
