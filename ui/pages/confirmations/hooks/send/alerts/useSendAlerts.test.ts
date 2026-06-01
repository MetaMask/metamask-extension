import { renderHook, act } from '@testing-library/react-hooks';
import { useSendContext } from '../../../context/send';
import { useTokenContractSendAlert } from './useTokenContractSendAlert';
import { useFirstTimeInteractionSendAlert } from './useFirstTimeInteractionSendAlert';
import { useSendAlerts } from './useSendAlerts';
import type { SendAlert } from './types';

jest.mock('../../../context/send');
jest.mock('./useTokenContractSendAlert');
jest.mock('./useFirstTimeInteractionSendAlert');

const TOKEN_CONTRACT_ALERT: SendAlert = {
  key: 'tokenContract',
  title: 'Smart contract address',
  message: 'You are sending to a token contract.',
};

const FIRST_TIME_ALERT: SendAlert = {
  key: 'firstTimeInteraction',
  title: 'New address',
  message: 'You are sending to this address for the first time.',
  acknowledgeButtonLabel: 'Continue',
};

describe('useSendAlerts', () => {
  const mockUseSendContext = jest.mocked(useSendContext);
  const mockUseTokenContractSendAlert = jest.mocked(useTokenContractSendAlert);
  const mockUseFirstTimeInteractionSendAlert = jest.mocked(
    useFirstTimeInteractionSendAlert,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSendContext.mockReturnValue({
      to: '0xRecipient',
    } as unknown as ReturnType<typeof useSendContext>);
    mockUseTokenContractSendAlert.mockReturnValue(null);
    mockUseFirstTimeInteractionSendAlert.mockReturnValue(null);
  });

  it('returns empty alerts when no alert hooks trigger', () => {
    const { result } = renderHook(() => useSendAlerts());

    expect(result.current.alerts).toStrictEqual([]);
    expect(result.current.hasUnacknowledgedAlerts).toBe(false);
  });

  it('returns single alert when only token contract alert fires', () => {
    mockUseTokenContractSendAlert.mockReturnValue(TOKEN_CONTRACT_ALERT);

    const { result } = renderHook(() => useSendAlerts());

    expect(result.current.alerts).toStrictEqual([TOKEN_CONTRACT_ALERT]);
    expect(result.current.hasUnacknowledgedAlerts).toBe(true);
  });

  it('returns single alert when only first-time alert fires', () => {
    mockUseFirstTimeInteractionSendAlert.mockReturnValue(FIRST_TIME_ALERT);

    const { result } = renderHook(() => useSendAlerts());

    expect(result.current.alerts).toStrictEqual([FIRST_TIME_ALERT]);
    expect(result.current.hasUnacknowledgedAlerts).toBe(true);
  });

  it('returns multiple alerts when both hooks fire', () => {
    mockUseTokenContractSendAlert.mockReturnValue(TOKEN_CONTRACT_ALERT);
    mockUseFirstTimeInteractionSendAlert.mockReturnValue(FIRST_TIME_ALERT);

    const { result } = renderHook(() => useSendAlerts());

    expect(result.current.alerts).toStrictEqual([
      TOKEN_CONTRACT_ALERT,
      FIRST_TIME_ALERT,
    ]);
    expect(result.current.hasUnacknowledgedAlerts).toBe(true);
  });

  it('acknowledges alerts and sets hasUnacknowledgedAlerts to false', () => {
    mockUseTokenContractSendAlert.mockReturnValue(TOKEN_CONTRACT_ALERT);

    const { result } = renderHook(() => useSendAlerts());
    expect(result.current.hasUnacknowledgedAlerts).toBe(true);

    act(() => {
      result.current.acknowledgeAlerts();
    });

    expect(result.current.hasUnacknowledgedAlerts).toBe(false);
    expect(result.current.alerts).toStrictEqual([TOKEN_CONTRACT_ALERT]);
  });

  it('resets acknowledgment when recipient changes', () => {
    mockUseTokenContractSendAlert.mockReturnValue(TOKEN_CONTRACT_ALERT);

    const { result, rerender } = renderHook(() => useSendAlerts());

    act(() => {
      result.current.acknowledgeAlerts();
    });
    expect(result.current.hasUnacknowledgedAlerts).toBe(false);

    mockUseSendContext.mockReturnValue({
      to: '0xNewRecipient',
    } as unknown as ReturnType<typeof useSendContext>);

    rerender();

    expect(result.current.hasUnacknowledgedAlerts).toBe(true);
  });

  it('is not unacknowledged when there are no alerts even without acknowledgment', () => {
    const { result } = renderHook(() => useSendAlerts());

    expect(result.current.hasUnacknowledgedAlerts).toBe(false);
    expect(result.current.alerts).toStrictEqual([]);
  });
});
