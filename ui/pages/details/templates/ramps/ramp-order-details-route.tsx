import React from 'react';
import { Header } from '../../components/header';
import { useRampsDetailsItem } from './hooks';
import { RampOrderDetails } from './ramp-order-details';

type Props = {
  chainId: string | undefined;
  txIdentifier: string | undefined;
  onBack: () => void;
  children: React.ReactNode;
};

/**
 * Ramps-owned details entry: when the route identifier matches a ramps order,
 * render the ramps header + template and skip the generic details page.
 *
 * @param props - Route props.
 * @param props.chainId - CAIP chain from the details route.
 * @param props.txIdentifier - Settlement hash or internal order code.
 * @param props.onBack - Back navigation handler.
 * @param props.children - Generic details page when this is not a ramps order.
 * @returns Ramps details, or the generic children fallback.
 */
export function RampOrderDetailsRoute({
  chainId,
  txIdentifier,
  onBack,
  children,
}: Props) {
  const rampsItem = useRampsDetailsItem(txIdentifier, chainId);

  if (!rampsItem) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full flex-col bg-background-default [container-name:list-item] [container-type:inline-size]">
      <div className="shrink-0 px-4 py-4">
        <Header item={rampsItem} onBack={onBack} />
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto px-4 pb-4">
        <RampOrderDetails item={rampsItem} />
      </div>
    </div>
  );
}
