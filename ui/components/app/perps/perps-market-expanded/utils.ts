import type { PerpsMarketData } from '@metamask/perps-controller';
import { brandColor } from '@metamask/design-tokens';
import type { ChartPriceLine } from '../perps-candlestick-chart';
import type { ExistingPositionData } from '../order-entry';
import { formatSignedChangePercent, getChangeColor } from '../utils';
import { formatPerpsFiatUniversal } from '../utils/formatPerpsDisplayPrice';
import type { Order, Position } from '../types';

export const DEFAULT_EXPANDED_LEVERAGE = 3;

export function parseMarketPrice(
  formatted: string | number | null | undefined,
): number {
  return Number.parseFloat(String(formatted ?? '').replace(/[$,]/gu, '')) || 0;
}

export function findMarketBySymbol(
  markets: PerpsMarketData[],
  symbol?: string,
): PerpsMarketData | undefined {
  if (!symbol) {
    return undefined;
  }

  return markets.find(
    (candidate) => candidate.symbol.toLowerCase() === symbol.toLowerCase(),
  );
}

export function findExpandedPositionForSymbol(
  positions: Position[],
  symbol?: string,
): Position | undefined {
  if (!symbol) {
    return undefined;
  }

  return positions.find(
    (position) => position.symbol.toLowerCase() === symbol.toLowerCase(),
  );
}

export function toExpandedExistingPositionData(
  position: Position,
): ExistingPositionData {
  return {
    symbol: position.symbol,
    size: position.size,
    leverage: position.leverage.value,
    entryPrice: position.entryPrice,
    takeProfitPrice: position.takeProfitPrice,
    stopLossPrice: position.stopLossPrice,
  };
}

export function getExpandedDisplayPrice({
  chartCurrentPrice,
  livePrice,
  marketPrice,
}: {
  chartCurrentPrice: number;
  livePrice?: string;
  marketPrice?: string;
}): string {
  if (chartCurrentPrice > 0) {
    return formatPerpsFiatUniversal(chartCurrentPrice);
  }

  const streamPrice = Number.parseFloat(livePrice ?? '');
  if (Number.isFinite(streamPrice) && streamPrice > 0) {
    return formatPerpsFiatUniversal(streamPrice);
  }

  return marketPrice ? formatPerpsFiatUniversal(marketPrice) : '$0.00';
}

export function getExpandedDisplayChange(change?: string | number): {
  displayChange: string;
  changeColor: ReturnType<typeof getChangeColor>;
} {
  const displayChange = formatSignedChangePercent(String(change ?? ''));
  return {
    displayChange,
    changeColor: getChangeColor(displayChange),
  };
}

export function getExpandedMaxLeverage(market?: PerpsMarketData): number {
  if (!market?.maxLeverage) {
    return 50;
  }

  const parsed = Number.parseInt(market.maxLeverage.replace('x', ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
}

export function getExpandedInitialLeverage({
  symbol,
  isTestnet,
  maxLeverage,
  tradeConfigurations,
}: {
  symbol?: string;
  isTestnet: boolean;
  maxLeverage: number;
  tradeConfigurations: Record<
    string,
    Record<string, { leverage?: number } | undefined> | undefined
  >;
}): number {
  if (!symbol) {
    return DEFAULT_EXPANDED_LEVERAGE;
  }

  const env = isTestnet ? 'testnet' : 'mainnet';
  const saved =
    tradeConfigurations[env]?.[symbol]?.leverage ?? DEFAULT_EXPANDED_LEVERAGE;
  return Math.min(saved, maxLeverage);
}

export function getExpandedOraclePrice(markPrice?: string): number | undefined {
  const parsed = Number.parseFloat(markPrice ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function getChartCurrentPrice(
  candleData:
    | {
        candles?: { close?: string }[];
      }
    | null
    | undefined,
): number {
  const lastCandle = candleData?.candles?.at(-1);
  return lastCandle?.close ? Number.parseFloat(lastCandle.close) : 0;
}

export function buildExpandedChartPriceLines({
  currentPrice,
  decodedSymbol,
  isDark,
  positions,
}: {
  currentPrice: number;
  decodedSymbol: string;
  isDark: boolean;
  positions: Position[];
}): ChartPriceLine[] {
  if (currentPrice <= 0) {
    return [];
  }

  return [
    {
      price: currentPrice,
      label: '',
      color: isDark ? '#ffffff0a' : '#b4b4b528',
      lineStyle: 2,
      lineWidth: 2,
    },
    ...positions
      .filter(
        (position) =>
          position.symbol.toLowerCase() === decodedSymbol.toLowerCase(),
      )
      .flatMap((position): ChartPriceLine[] => {
        const lines: ChartPriceLine[] = [];
        const entryPrice = parseMarketPrice(position.entryPrice);
        const liquidationPrice = parseMarketPrice(position.liquidationPrice);

        if (entryPrice > 0) {
          lines.push({
            price: entryPrice,
            label: 'Entry',
            color: isDark ? brandColor.grey600 : brandColor.grey200,
            lineStyle: 2,
          });
        }

        if (liquidationPrice > 0) {
          lines.push({
            price: liquidationPrice,
            label: 'Liq',
            color: isDark ? brandColor.red300 : brandColor.red500,
            lineStyle: 2,
          });
        }

        return lines;
      }),
  ];
}

export function filterExpandedOpenOrders(orders: Order[]): Order[] {
  return orders.filter(
    (order) =>
      order.status === 'open' &&
      !order.isTrigger &&
      order.isPositionTpsl !== true &&
      !order.isSynthetic,
  );
}

export function resolveModalCurrentPrice({
  activePositionTarget,
  currentPrice,
  decodedSymbol,
  markets,
}: {
  activePositionTarget: Position | null;
  currentPrice: number;
  decodedSymbol?: string;
  markets: PerpsMarketData[];
}): number {
  if (!activePositionTarget) {
    return currentPrice;
  }
  if (
    decodedSymbol &&
    activePositionTarget.symbol.toLowerCase() === decodedSymbol.toLowerCase()
  ) {
    return currentPrice;
  }
  const targetMarket = markets.find(
    (candidate) =>
      candidate.symbol.toLowerCase() ===
      activePositionTarget.symbol.toLowerCase(),
  );
  return parseMarketPrice(targetMarket?.price) || currentPrice;
}
