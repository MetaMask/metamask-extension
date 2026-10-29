import {
  useRampsUserRegion,
  type UseRampsUserRegionResult,
} from './useRampsUserRegion';
import {
  useRampsProviders,
  type UseRampsProvidersResult,
} from './useRampsProviders';
import { useRampsTokens, type UseRampsTokensResult } from './useRampsTokens';
import {
  useRampsCountries,
  type UseRampsCountriesResult,
} from './useRampsCountries';
import {
  useRampsPaymentMethods,
  type UseRampsPaymentMethodsResult,
} from './useRampsPaymentMethods';
import { useRampsQuotes, type UseRampsQuotesResult } from './useRampsQuotes';
import { useRampsOrders, type UseRampsOrdersResult } from './useRampsOrders';

export type UseRampsControllerResult = {
  userRegion: UseRampsUserRegionResult['userRegion'];
  setUserRegion: UseRampsUserRegionResult['setUserRegion'];
  selectedProvider: UseRampsProvidersResult['selectedProvider'];
  setSelectedProvider: UseRampsProvidersResult['setSelectedProvider'];
  providers: UseRampsProvidersResult['providers'];
  providersLoading: UseRampsProvidersResult['isLoading'];
  providersError: UseRampsProvidersResult['error'];
  tokens: UseRampsTokensResult['tokens'];
  selectedToken: UseRampsTokensResult['selectedToken'];
  setSelectedToken: UseRampsTokensResult['setSelectedToken'];
  tokensLoading: UseRampsTokensResult['isLoading'];
  tokensError: UseRampsTokensResult['error'];
  countries: UseRampsCountriesResult['countries'];
  countriesLoading: UseRampsCountriesResult['isLoading'];
  countriesError: UseRampsCountriesResult['error'];
  paymentMethods: UseRampsPaymentMethodsResult['paymentMethods'];
  selectedPaymentMethod: UseRampsPaymentMethodsResult['selectedPaymentMethod'];
  setSelectedPaymentMethod: UseRampsPaymentMethodsResult['setSelectedPaymentMethod'];
  paymentMethodsLoading: UseRampsPaymentMethodsResult['isLoading'];
  paymentMethodsFetching: UseRampsPaymentMethodsResult['isFetching'];
  paymentMethodsStatus: UseRampsPaymentMethodsResult['status'];
  paymentMethodsError: UseRampsPaymentMethodsResult['error'];
  getQuotes: UseRampsQuotesResult['getQuotes'];
  getBuyWidgetData: UseRampsQuotesResult['getBuyWidgetData'];
  orders: UseRampsOrdersResult['orders'];
  getOrderById: UseRampsOrdersResult['getOrderById'];
  addOrder: UseRampsOrdersResult['addOrder'];
  addPrecreatedOrder: UseRampsOrdersResult['addPrecreatedOrder'];
  removeOrder: UseRampsOrdersResult['removeOrder'];
  refreshOrder: UseRampsOrdersResult['refreshOrder'];
  getOrderFromCallback: UseRampsOrdersResult['getOrderFromCallback'];
};

export function useRampsController(): UseRampsControllerResult {
  const { userRegion, setUserRegion } = useRampsUserRegion();
  const {
    providers,
    selectedProvider,
    setSelectedProvider,
    isLoading: providersLoading,
    error: providersError,
  } = useRampsProviders();
  const {
    tokens,
    selectedToken,
    setSelectedToken,
    isLoading: tokensLoading,
    error: tokensError,
  } = useRampsTokens();
  const {
    countries,
    isLoading: countriesLoading,
    error: countriesError,
  } = useRampsCountries();
  const {
    paymentMethods,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    isLoading: paymentMethodsLoading,
    isFetching: paymentMethodsFetching,
    status: paymentMethodsStatus,
    error: paymentMethodsError,
  } = useRampsPaymentMethods();
  const { getQuotes, getBuyWidgetData } = useRampsQuotes();
  const {
    orders,
    getOrderById,
    addOrder,
    addPrecreatedOrder,
    removeOrder,
    refreshOrder,
    getOrderFromCallback,
  } = useRampsOrders();

  return {
    userRegion,
    setUserRegion,
    selectedProvider,
    setSelectedProvider,
    providers,
    providersLoading,
    providersError,
    tokens,
    selectedToken,
    setSelectedToken,
    tokensLoading,
    tokensError,
    countries,
    countriesLoading,
    countriesError,
    paymentMethods,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    paymentMethodsLoading,
    paymentMethodsFetching,
    paymentMethodsStatus,
    paymentMethodsError,
    getQuotes,
    getBuyWidgetData,
    orders,
    getOrderById,
    addOrder,
    addPrecreatedOrder,
    removeOrder,
    refreshOrder,
    getOrderFromCallback,
  };
}

export default useRampsController;
