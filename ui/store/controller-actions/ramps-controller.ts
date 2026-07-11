import type {
  BuyWidget,
  ExecuteRequestOptions,
  PaymentMethod,
  Provider,
  Quote,
  QuotesResponse,
  RampsOrder,
  UserRegion,
} from '@metamask/ramps-controller';
import { submitRequestToBackground } from '../background-connection';

export async function setRampsUserRegion(
  region: string,
  options?: ExecuteRequestOptions,
): Promise<UserRegion | null> {
  return submitRequestToBackground('setRampsUserRegion', [region, options]);
}

export async function setRampsSelectedToken(assetId: string): Promise<void> {
  return submitRequestToBackground('setRampsSelectedToken', [assetId]);
}

export async function setRampsSelectedProvider(
  provider: Provider | string | null,
  options?: { autoSelected?: boolean },
): Promise<void> {
  return submitRequestToBackground('setRampsSelectedProvider', [
    provider,
    options,
  ]);
}

export async function setRampsSelectedPaymentMethod(
  paymentMethod: PaymentMethod | string | null,
): Promise<void> {
  return submitRequestToBackground('setRampsSelectedPaymentMethod', [
    paymentMethod,
  ]);
}

export async function getRampsTokens(
  region: string,
  action: 'buy' | 'sell' = 'buy',
): Promise<void> {
  return submitRequestToBackground('getRampsTokens', [region, action]);
}

export async function getRampsProviders(region: string) {
  return submitRequestToBackground('getRampsProviders', [region]);
}

export async function getRampsPaymentMethods(
  region: string,
  options: {
    fiat: string;
    assetId?: string;
    provider?: string;
  },
) {
  return submitRequestToBackground('getRampsPaymentMethods', [region, options]);
}

export type GetRampsQuotesParams = {
  region?: string;
  fiat?: string;
  assetId?: string;
  amount: number;
  walletAddress: string;
  paymentMethods?: string[];
  providers?: string[];
  redirectUrl?: string;
  forceRefresh?: boolean;
  ttl?: number;
};

export async function getRampsQuotes(
  options: GetRampsQuotesParams,
): Promise<QuotesResponse> {
  return submitRequestToBackground('getRampsQuotes', [options]);
}

export async function getRampsBuyWidgetData(
  quote: Quote,
): Promise<BuyWidget | null> {
  return submitRequestToBackground('getRampsBuyWidgetData', [quote]);
}

export async function addRampsPrecreatedOrder(params: {
  orderId: string;
  providerCode: string;
  walletAddress: string;
  chainId?: string;
}): Promise<void> {
  return submitRequestToBackground('addRampsPrecreatedOrder', [params]);
}

export async function addRampsOrder(order: RampsOrder): Promise<void> {
  return submitRequestToBackground('addRampsOrder', [order]);
}

export async function removeRampsOrder(providerOrderId: string): Promise<void> {
  return submitRequestToBackground('removeRampsOrder', [providerOrderId]);
}

export async function refreshRampsOrder(
  providerCode: string,
  orderCode: string,
  wallet: string,
): Promise<RampsOrder> {
  return submitRequestToBackground('refreshRampsOrder', [
    providerCode,
    orderCode,
    wallet,
  ]);
}

export async function getRampsOrderFromCallback(
  providerCode: string,
  callbackUrl: string,
  wallet: string,
): Promise<RampsOrder> {
  return submitRequestToBackground('getRampsOrderFromCallback', [
    providerCode,
    callbackUrl,
    wallet,
  ]);
}

export async function syncRampsOrdersWithUserStorage(): Promise<void> {
  return submitRequestToBackground('syncRampsOrdersWithUserStorage');
}
