import '../../../../../test/jest/strict-mode';

import { waitFor } from '@testing-library/react';

import mockState from '../../../../../test/data/mock-state.json';
import { EVM_ASSET } from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useSendContext } from '../../context/send';
import * as NameValidation from './useNameValidation';
import { useSendType } from './useSendType';
import { useRecipientValidation } from './useRecipientValidation';
import { useSendAlerts } from './alerts/useSendAlerts';

jest.mock('../../../../hooks/useI18nContext');
jest.mock('../../context/send');
jest.mock('./useSendType');
jest.mock('./alerts/useSendAlerts');

/**
 * Regression test for the StrictMode remount bug: the validation effect used
 * a lifetime `unmountedRef` that was set to `true` by the StrictMode
 * setup/cleanup/setup probe and never re-armed, so every validation result
 * (including ENS resolutions) was discarded and `setResult` never ran.
 */
describe('useRecipientValidation under StrictMode', () => {
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockUseSendContext = jest.mocked(useSendContext);
  const mockUseSendType = jest.mocked(useSendType);
  const mockUseSendAlerts = jest.mocked(useSendAlerts);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockUseI18nContext.mockReturnValue((key: string) => key);
    mockUseSendAlerts.mockReturnValue({
      alerts: [],
      hasUnacknowledgedAlerts: false,
      acknowledgeAlerts: jest.fn(),
    });
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
      isStellarSendType: false,
    } as unknown as ReturnType<typeof useSendType>);
    mockUseSendContext.mockReturnValue({
      asset: EVM_ASSET,
      to: 'vitalik.eth',
      chainId: '0x1',
    } as unknown as ReturnType<typeof useSendContext>);
  });

  it('resolves ENS names after a StrictMode setup/cleanup/setup probe', async () => {
    jest.spyOn(NameValidation, 'useNameValidation').mockReturnValue({
      validateName: () =>
        Promise.resolve({ resolvedLookup: '0x123', protocol: 'ens' }),
    });

    const { result } = renderHookWithProvider(
      useRecipientValidation,
      mockState,
    );

    await waitFor(() => {
      expect(result.current.recipientResolvedLookup).toBe('0x123');
      expect(result.current.toAddressValidated).toBe('vitalik.eth');
    });
  });
});
