import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { NameType } from '@metamask/name-controller';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  useTrustSignal,
  TrustSignalDisplayState,
} from '../../../../../hooks/useTrustSignals';
import { getExperience } from '../../../../../../shared/constants/verification';
import { useSendContext } from '../../../context/send';
import { checkFirstTimeInteraction } from '../../../../../store/actions';
import { useFirstTimeInteractionSendAlert } from './useFirstTimeInteractionSendAlert';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../hooks/useI18nContext');
jest.mock('../../../../../hooks/useTrustSignals');
jest.mock('../../../../../../shared/constants/verification');
jest.mock('../../../context/send');
jest.mock('../../../../../store/actions', () => ({
  checkFirstTimeInteraction: jest.fn(),
}));

const MOCK_FROM = '0xFromAddress1234567890abcdef12345678';
const MOCK_TO = '0xToAddress1234567890abcdef123456789';

describe('useFirstTimeInteractionSendAlert', () => {
  const mockT = jest.fn(
    (key: string, substitutions?: (string | React.ReactNode)[]) =>
      substitutions ? [key, ':', ...substitutions] : key,
  );
  const mockUseSendContext = jest.mocked(useSendContext);
  const mockUseTrustSignal = jest.mocked(useTrustSignal);
  const mockGetExperience = jest.mocked(getExperience);
  const mockCheckFirstTimeInteraction = jest.mocked(checkFirstTimeInteraction);
  const mockUseSelector = jest.mocked(useSelector);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useI18nContext).mockReturnValue(mockT);
    mockUseSendContext.mockReturnValue({
      to: MOCK_TO,
      from: MOCK_FROM,
      chainId: '0x1',
    } as unknown as ReturnType<typeof useSendContext>);
    mockUseSelector.mockReturnValue([]);
    mockUseTrustSignal.mockReturnValue({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
    mockGetExperience.mockReturnValue(undefined);
    mockCheckFirstTimeInteraction.mockResolvedValue(true);
  });

  it('returns null when there is no recipient', () => {
    mockUseSendContext.mockReturnValue({
      to: undefined,
      from: MOCK_FROM,
      chainId: '0x1',
    } as unknown as ReturnType<typeof useSendContext>);

    const { result } = renderHook(() => useFirstTimeInteractionSendAlert());
    expect(result.current).toBeNull();
  });

  it('returns null when there is no from address', () => {
    mockUseSendContext.mockReturnValue({
      to: MOCK_TO,
      from: undefined,
      chainId: '0x1',
    } as unknown as ReturnType<typeof useSendContext>);

    const { result } = renderHook(() => useFirstTimeInteractionSendAlert());
    expect(result.current).toBeNull();
  });

  it('returns null when recipient is an internal account', () => {
    mockUseSelector.mockReturnValue([{ address: MOCK_TO.toLowerCase() }]);

    const { result } = renderHook(() => useFirstTimeInteractionSendAlert());
    expect(result.current).toBeNull();
  });

  it('returns alert when it is a first-time interaction', async () => {
    mockCheckFirstTimeInteraction.mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFirstTimeInteractionSendAlert(),
    );

    await waitForNextUpdate();

    expect(result.current).not.toBeNull();
    expect(result.current?.key).toBe('firstTimeInteraction');
    expect(result.current?.title).toBe('sendAlertNewAddressTitle');
    expect(result.current?.acknowledgeButtonLabel).toBe('continue');
    expect(result.current?.message).toBeDefined();
  });

  it('returns null for a returning address (not first-time)', async () => {
    mockCheckFirstTimeInteraction.mockResolvedValue(false);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFirstTimeInteractionSendAlert(),
    );

    try {
      await waitForNextUpdate({ timeout: 100 });
    } catch {
      // No update expected
    }

    expect(result.current).toBeNull();
  });

  it('returns null when API returns undefined', async () => {
    mockCheckFirstTimeInteraction.mockResolvedValue(undefined);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFirstTimeInteractionSendAlert(),
    );

    try {
      await waitForNextUpdate({ timeout: 100 });
    } catch {
      // No update expected
    }

    expect(result.current).toBeNull();
  });

  it('returns null when recipient is a verified address', () => {
    mockUseTrustSignal.mockReturnValue({
      state: TrustSignalDisplayState.Verified,
      label: 'Verified',
    });

    const { result } = renderHook(() => useFirstTimeInteractionSendAlert());
    expect(result.current).toBeNull();
  });

  it('returns null when trust signal is loading', () => {
    mockUseTrustSignal.mockReturnValue({
      state: TrustSignalDisplayState.Loading,
      label: null,
    });

    const { result } = renderHook(() => useFirstTimeInteractionSendAlert());
    expect(result.current).toBeNull();
  });

  it('returns null when recipient is a first-party contract', () => {
    mockGetExperience.mockReturnValue('metamask' as never);

    const { result } = renderHook(() => useFirstTimeInteractionSendAlert());
    expect(result.current).toBeNull();
  });

  it('calls useTrustSignal with correct arguments', () => {
    renderHook(() => useFirstTimeInteractionSendAlert());

    expect(mockUseTrustSignal).toHaveBeenCalledWith(
      MOCK_TO,
      NameType.ETHEREUM_ADDRESS,
      '0x1',
    );
  });

  it('calls checkFirstTimeInteraction with correct arguments', async () => {
    const { waitForNextUpdate } = renderHook(() =>
      useFirstTimeInteractionSendAlert(),
    );

    await waitForNextUpdate();

    expect(mockCheckFirstTimeInteraction).toHaveBeenCalledWith({
      from: MOCK_FROM,
      to: MOCK_TO,
      chainId: 1,
    });
  });

  it('resets when recipient changes', async () => {
    mockCheckFirstTimeInteraction.mockResolvedValue(true);

    const { result, waitForNextUpdate, rerender } = renderHook(() =>
      useFirstTimeInteractionSendAlert(),
    );

    await waitForNextUpdate();
    expect(result.current).not.toBeNull();

    mockCheckFirstTimeInteraction.mockResolvedValue(false);
    mockUseSendContext.mockReturnValue({
      to: '0xNewRecipientAddress12345678901234567',
      from: MOCK_FROM,
      chainId: '0x1',
    } as unknown as ReturnType<typeof useSendContext>);

    rerender();

    try {
      await waitForNextUpdate({ timeout: 100 });
    } catch {
      // No update expected
    }

    expect(result.current).toBeNull();
  });
});
