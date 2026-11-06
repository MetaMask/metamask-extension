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
  return submitRequestToBackground('RampsController:setUserRegion', [
    region,
    options,
  ]);
}

export async function setRampsSelectedToken(assetId: string): Promise<void> {
  return submitRequestToBackground('RampsController:setSelectedToken', [
    assetId,
  ]);
}

export async function setRampsSelectedProvider(
  provider: Provider | string | null,
  options?: { autoSelected?: boolean },
): Promise<void> {
  return submitRequestToBackground('RampsController:setSelectedProvider', [
    provider,
    options,
  ]);
}

export async function setRampsSelectedPaymentMethod(
  paymentMethod: PaymentMethod | string | null,
): Promise<void> {
  return submitRequestToBackground('RampsController:setSelectedPaymentMethod', [
    paymentMethod,
  ]);
}

export async function getRampsTokens(
  region: string,
  action: 'buy' | 'sell' = 'buy',
) {
  return submitRequestToBackground('RampsController:getTokens', [
    region,
    action,
  ]);
}

export async function getRampsProviders(region: string) {
  return submitRequestToBackground('RampsController:getProviders', [region]);
}

export async function getRampsPaymentMethods(
  region: string,
  options: {
    fiat: string;
    assetId?: string;
    provider?: string;
  },
) {
  return submitRequestToBackground('RampsController:getPaymentMethods', [
    region,
    options,
  ]);
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
  return submitRequestToBackground('RampsController:getQuotes', [options]);
}

export async function getRampsBuyWidgetData(
  quote: Quote,
): Promise<BuyWidget | null> {
  return submitRequestToBackground('RampsController:getBuyWidgetData', [quote]);
}

export async function addRampsPrecreatedOrder(params: {
  orderId: string;
  providerCode: string;
  walletAddress: string;
  // Required since ramps-controller v20: precreated stubs must carry a network.
  chainId: string;
}): Promise<void> {
  return submitRequestToBackground('RampsController:addPrecreatedOrder', [
    params,
  ]);
}

export async function addRampsOrder(order: RampsOrder): Promise<void> {
  return submitRequestToBackground('RampsController:addOrder', [order]);
}

export async function removeRampsOrder(providerOrderId: string): Promise<void> {
  return submitRequestToBackground('RampsController:removeOrder', [
    providerOrderId,
  ]);
}

export async function refreshRampsOrder(
  providerCode: string,
  orderCode: string,
  wallet: string,
): Promise<RampsOrder> {
  return submitRequestToBackground('RampsController:getOrder', [
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
  return submitRequestToBackground('RampsController:getOrderFromCallback', [
    providerCode,
    callbackUrl,
    wallet,
  ]);
}

export async function syncRampsOrdersWithUserStorage(): Promise<void> {
  return submitRequestToBackground('RampsController:syncOrdersWithUserStorage');
}

export async function watchRampsCheckoutTab(params: {
  url: string;
  providerCode: string;
  walletAddress: string;
  orderCode?: string;
  checkoutSessionId: string;
  region?: string;
  providerName?: string;
}): Promise<void> {
  return submitRequestToBackground('watchRampsCheckoutTab', [params]);
}

export async function watchRampsProviderOrderTab(params: {
  url: string;
  providerCode: string;
  walletAddress: string;
  orderCode?: string;
}): Promise<void> {
  return submitRequestToBackground('watchRampsProviderOrderTab', [params]);
}
