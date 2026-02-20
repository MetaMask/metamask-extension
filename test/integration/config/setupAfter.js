// This file is for Jest-specific setup only and runs before our Jest tests.
import nock from 'nock';
import { jestPreviewConfigure } from 'jest-preview';
import { ACCOUNTS_API_BASE_URL } from '../../../shared/constants/accounts';
import '../config/assets/index.css';
import '../../helpers/setup-after-helper';

beforeEach(() => {
  nock(ACCOUNTS_API_BASE_URL)
    .get('/v4/multiaccount/transactions')
    .query(true)
    .reply(200, { data: [], pageInfo: { hasNextPage: false, count: 0 } });
});

// Should be path from root of your project
jestPreviewConfigure({
  publicFolder: 'test/integration/config/assets', // No need to configure if `publicFolder` is `public`
});

// Mock Pay-related components to avoid importing large dependency trees
// These components are not used by existing integration tests
jest.mock(
  '../../../ui/pages/confirmations/components/confirm/info/perps-deposit-info',
  () => ({
    PerpsDepositInfo: () => null,
  }),
);

jest.mock(
  '../../../ui/pages/confirmations/components/confirm/info/musd-conversion-info',
  () => ({
    MusdConversionInfo: () => null,
  }),
);

jest.mock(
  '../../../ui/pages/confirmations/components/info/custom-amount-info',
  () => ({
    CustomAmountInfo: () => null,
    CustomAmountInfoSkeleton: () => null,
  }),
);
