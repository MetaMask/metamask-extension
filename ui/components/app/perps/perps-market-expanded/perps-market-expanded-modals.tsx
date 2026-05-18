import React, { useMemo } from 'react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { usePerpsMarketInfo } from '../../../../hooks/perps';
import { PerpsGeoBlockModal } from '../perps-geo-block-modal';
import { EditMarginModal } from '../edit-margin';
import { ReversePositionModal } from '../reverse-position';
import { UpdateTPSLModal } from '../update-tpsl';
import { ClosePositionModal } from '../close-position';
import { CancelOrderModal } from '../cancel-order';
import type { AccountState, Order, Position } from '../types';
import { resolveModalCurrentPrice } from './utils';

export type PerpsMarketExpandedModalsProps = {
  account: AccountState | null;
  selectedAddress?: string;
  currentPrice: number;
  decodedSymbol: string;
  markets: PerpsMarketData[];
  marginPositionTarget: Position | null;
  reversePositionTarget: Position | null;
  tpslPositionTarget: Position | null;
  closePositionTarget: Position | null;
  cancelOrderTarget: Order | null;
  isGeoBlockModalOpen: boolean;
  onMarginPositionClose: () => void;
  onReversePositionClose: () => void;
  onTPSLPositionClose: () => void;
  onClosePositionClose: () => void;
  onCancelOrderClose: () => void;
  onGeoBlockModalClose: () => void;
};

export const PerpsMarketExpandedModals: React.FC<
  PerpsMarketExpandedModalsProps
> = ({
  account,
  selectedAddress,
  currentPrice,
  decodedSymbol,
  markets,
  marginPositionTarget,
  reversePositionTarget,
  tpslPositionTarget,
  closePositionTarget,
  cancelOrderTarget,
  isGeoBlockModalOpen,
  onMarginPositionClose,
  onReversePositionClose,
  onTPSLPositionClose,
  onClosePositionClose,
  onCancelOrderClose,
  onGeoBlockModalClose,
}) => {
  const activePositionTarget =
    closePositionTarget ??
    reversePositionTarget ??
    tpslPositionTarget ??
    marginPositionTarget;
  const actionMarketInfo = usePerpsMarketInfo(
    activePositionTarget?.symbol ?? decodedSymbol,
  );
  const modalCurrentPrice = useMemo(
    () =>
      resolveModalCurrentPrice({
        activePositionTarget,
        currentPrice,
        decodedSymbol,
        markets,
      }),
    [activePositionTarget, currentPrice, decodedSymbol, markets],
  );

  return (
    <>
      {marginPositionTarget && selectedAddress ? (
        <EditMarginModal
          isOpen={Boolean(marginPositionTarget)}
          onClose={onMarginPositionClose}
          position={marginPositionTarget}
          account={account}
          currentPrice={modalCurrentPrice}
          mode="add"
        />
      ) : null}

      {reversePositionTarget ? (
        <ReversePositionModal
          isOpen={Boolean(reversePositionTarget)}
          onClose={onReversePositionClose}
          position={reversePositionTarget}
          currentPrice={modalCurrentPrice}
          sizeDecimals={actionMarketInfo?.szDecimals}
        />
      ) : null}

      {tpslPositionTarget ? (
        <UpdateTPSLModal
          key={tpslPositionTarget.symbol}
          isOpen={Boolean(tpslPositionTarget)}
          onClose={onTPSLPositionClose}
          position={tpslPositionTarget}
          currentPrice={modalCurrentPrice}
        />
      ) : null}

      {closePositionTarget ? (
        <ClosePositionModal
          isOpen={Boolean(closePositionTarget)}
          onClose={onClosePositionClose}
          position={closePositionTarget}
          currentPrice={modalCurrentPrice}
          sizeDecimals={actionMarketInfo?.szDecimals}
        />
      ) : null}

      {cancelOrderTarget ? (
        <CancelOrderModal
          isOpen={Boolean(cancelOrderTarget)}
          onClose={onCancelOrderClose}
          order={cancelOrderTarget}
        />
      ) : null}

      <PerpsGeoBlockModal
        isOpen={isGeoBlockModalOpen}
        onClose={onGeoBlockModalClose}
      />
    </>
  );
};
