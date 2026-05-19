import { MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE } from '../../../helpers/constants/routes';
import {
  getMultichainAccountAddressListPagePath,
  getMultichainAccountAddressListReceivePagePath,
} from './multichain-account-address-list-page.utils';
import { AddressListSource } from './multichain-account-address-list-page.types';

describe('multichain-account-address-list-page utils', () => {
  const accountGroupId = 'entropy:wallet1/group1';

  describe('getMultichainAccountAddressListPagePath', () => {
    it('returns the address list route with an encoded account group id', () => {
      expect(getMultichainAccountAddressListPagePath(accountGroupId)).toBe(
        `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}?accountGroupId=${encodeURIComponent(accountGroupId)}`,
      );
    });

    it('includes the receive source query param when provided', () => {
      expect(
        getMultichainAccountAddressListPagePath(accountGroupId, {
          source: AddressListSource.Receive,
        }),
      ).toBe(getMultichainAccountAddressListReceivePagePath(accountGroupId));
    });
  });

  describe('getMultichainAccountAddressListReceivePagePath', () => {
    it('returns the receive-flow address list route', () => {
      expect(
        getMultichainAccountAddressListReceivePagePath(accountGroupId),
      ).toBe(
        `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}?accountGroupId=${encodeURIComponent(accountGroupId)}&source=receive`,
      );
    });
  });
});
