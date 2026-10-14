import React from 'react';
import configureMockStore from 'redux-mock-store';
import { screen, waitFor } from '@testing-library/react';

import { getMockTypedSignConfirmStateForRequest } from '../../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../../test/lib/confirmations/render-helpers';
import {
  permitNFTSignatureMsg,
  permitSignatureMsg,
  permitSignatureMsgWithUnsignedFields,
} from '../../../../../../../../../test/data/confirmations/typed_sign';
import { memoizedGetTokenStandardAndDetails } from '../../../../../../utils/token';
import { enLocale as messages } from '../../../../../../../../../test/lib/i18n-helpers';
import PermitSimulation from './permit-simulation';

jest.mock('../../../../../../../../store/actions', () => {
  return {
    getTokenStandardAndDetails: jest
      .fn()
      .mockResolvedValue({ decimals: 2, standard: 'ERC20' }),
    getTokenStandardAndDetailsByChain: jest
      .fn()
      .mockResolvedValue({ decimals: 2, standard: 'ERC20' }),
  };
});

describe('PermitSimulation', () => {
  afterEach(() => {
    jest.clearAllMocks();

    /** Reset memoized function using getTokenStandardAndDetails for each test */
    memoizedGetTokenStandardAndDetails?.cache?.clear?.();
  });

  it('renders component correctly', async () => {
    const state = getMockTypedSignConfirmStateForRequest(permitSignatureMsg);
    const mockStore = configureMockStore([])(state);

    const { container } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    await waitFor(() => {
      expect(screen.getByText('30')).toBeInTheDocument();
    });
    expect(container).toMatchSnapshot();
  });

  it('ignores unsigned fields and displays the signed unlimited ERC-20 permit', async () => {
    const state = getMockTypedSignConfirmStateForRequest(
      permitSignatureMsgWithUnsignedFields,
    );
    const mockStore = configureMockStore([])(state);

    renderWithConfirmContextProvider(<PermitSimulation />, mockStore);

    expect(
      await screen.findByText(messages.unlimited.message),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.spendingCap.message)).toBeInTheDocument();
    expect(
      screen.getByText(messages.permitSimulationDetailInfo.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.permitSimulationChange_revoke2.message),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(messages.revokeSimulationDetailsDesc.message),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('#0')).not.toBeInTheDocument();
  });

  it('renders correctly for NFT permit', async () => {
    const state = getMockTypedSignConfirmStateForRequest(permitNFTSignatureMsg);
    const mockStore = configureMockStore([])(state);

    const { container } = renderWithConfirmContextProvider(
      <PermitSimulation />,
      mockStore,
    );

    await waitFor(() => {
      expect(
        screen.getByText(messages.perpsWithdraw.message),
      ).toBeInTheDocument();
      expect(screen.getByText('#3606393')).toBeInTheDocument();
    });
    expect(container).toMatchSnapshot();
  });
});
