import { MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE } from '../../../helpers/constants/routes';
import {
  AddressListQueryParams,
  AddressListSource,
} from './multichain-account-address-list-page.types';

type GetMultichainAccountAddressListPagePathOptions = {
  source?: AddressListSource;
};

/**
 * Builds the path for the multichain account address list page.
 *
 * @param accountGroupId - Account group id used by the address list page.
 * @param options - Optional query params.
 * @param options.source - Address list page source.
 * @returns Route path with encoded query params.
 */
export function getMultichainAccountAddressListPagePath(
  accountGroupId: string,
  { source }: GetMultichainAccountAddressListPagePathOptions = {},
): string {
  const searchParams = new URLSearchParams({
    accountGroupId,
  });

  if (source) {
    searchParams.set(AddressListQueryParams.Source, source);
  }

  return `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}?${searchParams.toString()}`;
}

/**
 * Builds the receive-flow path for the multichain account address list page.
 *
 * @param accountGroupId - Account group id used by the address list page.
 * @returns Route path for the receive address list view.
 */
export function getMultichainAccountAddressListReceivePagePath(
  accountGroupId: string,
): string {
  return getMultichainAccountAddressListPagePath(accountGroupId, {
    source: AddressListSource.Receive,
  });
}
