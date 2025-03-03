import { CHAIN_IDS } from '@metamask/transaction-controller';
import { waitFor } from '@testing-library/react';

import mockState from '../../../../../test/data/mock-state.json';
import { getMockContractInteractionConfirmState } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import * as Actions from '../../../../store/actions';
import { useNetworkAndOriginSwitchingAlerts } from './useNetworkAndOriginSwitchingAlerts';

describe('useNetworkAndOriginSwitchingAlerts', () => {
  it('returns an empty array when there is no current confirmation', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useNetworkAndOriginSwitchingAlerts(),
      mockState,
    );
    expect(result.current).toEqual([]);
  });

  it('returns an empty array when there is no previous confirmation', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useNetworkAndOriginSwitchingAlerts(),
      getMockContractInteractionConfirmState(),
    );
    expect(result.current).toEqual([]);
  });

  it('returns alert when previous confirmation is on different network or origin', async () => {
    jest.spyOn(Actions, 'getLastInteractedConfirmationInfo').mockResolvedValue({
      id: '123',
      timestamp: new Date().getTime() - 10,
      chainId: '0x1',
      origin: 'https://example.com',
    });
    const { result } = renderHookWithConfirmContextProvider(
      () => useNetworkAndOriginSwitchingAlerts(),
      getMockContractInteractionConfirmState(),
    );
    await waitFor(() => {
      expect(result.current).toEqual([
        {
          field: 'network',
          key: 'networkSwitchInfo',
          message: "You're now transacting on Goerli.",
          reason: 'Network changed',
          severity: 'info',
        },
        {
          field: 'requestFrom',
          key: 'originSwitchInfo',
          message:
            "You're now reviewing a request from https://metamask.github.io.",
          reason: 'Site changed',
          severity: 'info',
        },
      ]);
    });
  });

  it('returns alert when previous confirmation is on different network', async () => {
    jest.spyOn(Actions, 'getLastInteractedConfirmationInfo').mockResolvedValue({
      id: '123',
      timestamp: new Date().getTime() - 10,
      chainId: '0x1',
      origin: 'https://metamask.github.io',
    });
    const { result } = renderHookWithConfirmContextProvider(
      () => useNetworkAndOriginSwitchingAlerts(),
      getMockContractInteractionConfirmState(),
    );
    await waitFor(() => {
      expect(result.current).toEqual([
        {
          field: 'network',
          key: 'networkSwitchInfo',
          message: "You're now transacting on Goerli.",
          reason: 'Network changed',
          severity: 'info',
        },
      ]);
    });
  });

  it('returns alert when previous confirmation is on different origin', async () => {
    jest.spyOn(Actions, 'getLastInteractedConfirmationInfo').mockResolvedValue({
      id: '123',
      timestamp: new Date().getTime() - 10,
      chainId: CHAIN_IDS.GOERLI,
      origin: 'https://example.com',
    });
    const { result } = renderHookWithConfirmContextProvider(
      () => useNetworkAndOriginSwitchingAlerts(),
      getMockContractInteractionConfirmState(),
    );
    await waitFor(() => {
      expect(result.current).toEqual([
        {
          field: 'requestFrom',
          key: 'originSwitchInfo',
          message:
            "You're now reviewing a request from https://metamask.github.io.",
          reason: 'Site changed',
          severity: 'info',
        },
      ]);
    });
  });
});
