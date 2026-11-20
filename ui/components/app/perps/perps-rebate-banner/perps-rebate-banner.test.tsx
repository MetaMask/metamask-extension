import React from 'react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import {
  getIsPerpsRebatesEnabled,
  usePerpsRebate,
} from '../../../../hooks/perps/usePerpsRebate';
import {
  PerpsRebateBanner,
  PERPS_REBATE_BANNER_TEST_ID,
} from './perps-rebate-banner';

jest.mock('../../../../hooks/perps/usePerpsRebate', () => ({
  getIsPerpsRebatesEnabled: jest.fn(),
  usePerpsRebate: jest.fn(),
}));

const mockGetIsPerpsRebatesEnabled =
  getIsPerpsRebatesEnabled as jest.MockedFunction<
    typeof getIsPerpsRebatesEnabled
  >;
const mockUsePerpsRebate = usePerpsRebate as jest.MockedFunction<
  typeof usePerpsRebate
>;

const renderBanner = () =>
  renderWithProvider(
    <PerpsRebateBanner coin="BTC" direction="long" notionalUsd="100" />,
    configureStore({ metamask: mockState.metamask }),
  );

describe('PerpsRebateBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIsPerpsRebatesEnabled.mockReturnValue(true);
  });

  it('renders the rebate percentage when the user has a rebate', () => {
    mockUsePerpsRebate.mockReturnValue(10);

    const { getByTestId } = renderBanner();

    expect(getByTestId(PERPS_REBATE_BANNER_TEST_ID)).toHaveTextContent(
      'You’re getting 10% back on fees',
    );
  });

  it('renders nothing when the user has no rebate', () => {
    mockUsePerpsRebate.mockReturnValue(null);

    const { queryByTestId } = renderBanner();

    expect(queryByTestId(PERPS_REBATE_BANNER_TEST_ID)).not.toBeInTheDocument();
  });

  it('renders nothing when the feature flag is off', () => {
    mockGetIsPerpsRebatesEnabled.mockReturnValue(false);
    mockUsePerpsRebate.mockReturnValue(10);

    const { queryByTestId } = renderBanner();

    expect(queryByTestId(PERPS_REBATE_BANNER_TEST_ID)).not.toBeInTheDocument();
  });
});
