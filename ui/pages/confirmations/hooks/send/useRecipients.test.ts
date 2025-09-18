import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { type Recipient, useRecipients } from './useRecipients';
import * as useContactRecipientsModule from './useContactRecipients';
import * as useAccountRecipientsModule from './useAccountRecipients';

jest.mock('./useContactRecipients');
jest.mock('./useAccountRecipients');

const mockUseContactRecipients = jest.spyOn(
  useContactRecipientsModule,
  'useContactRecipients',
);
const mockUseAccountRecipients = jest.spyOn(
  useAccountRecipientsModule,
  'useAccountRecipients',
);

describe('useRecipients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns combined contact and account recipients', () => {
    const mockContactRecipients: Recipient[] = [
      { address: '0x1234567890', contactName: 'Contact 1' },
      { address: '0xabcdef1234', contactName: 'Contact 2' },
    ];

    const mockAccountRecipients: Recipient[] = [
      {
        address: '0x5678901234',
        walletName: 'Wallet 1',
        accountGroupName: 'Account 1',
      },
      {
        address: '0xfedcba5678',
        walletName: 'Wallet 2',
        accountGroupName: 'Account 2',
      },
    ];

    mockUseContactRecipients.mockReturnValue(mockContactRecipients);
    mockUseAccountRecipients.mockReturnValue(mockAccountRecipients);

    const { result } = renderHookWithProvider(() => useRecipients(), mockState);

    expect(result.current).toEqual([
      ...mockContactRecipients,
      ...mockAccountRecipients,
    ]);
  });

  it('returns empty array when both hooks return empty arrays', () => {
    mockUseContactRecipients.mockReturnValue([]);
    mockUseAccountRecipients.mockReturnValue([]);

    const { result } = renderHookWithProvider(() => useRecipients(), mockState);

    expect(result.current).toEqual([]);
  });

  it('returns only contact recipients when account recipients is empty', () => {
    const mockContactRecipients: Recipient[] = [
      { address: '0x1234567890', contactName: 'Contact 1' },
    ];

    mockUseContactRecipients.mockReturnValue(mockContactRecipients);
    mockUseAccountRecipients.mockReturnValue([]);

    const { result } = renderHookWithProvider(() => useRecipients(), mockState);

    expect(result.current).toEqual(mockContactRecipients);
  });

  it('returns only account recipients when contact recipients is empty', () => {
    const mockAccountRecipients: Recipient[] = [
      {
        address: '0x5678901234',
        walletName: 'Wallet 1',
        accountGroupName: 'Account 1',
      },
    ];

    mockUseContactRecipients.mockReturnValue([]);
    mockUseAccountRecipients.mockReturnValue(mockAccountRecipients);

    const { result } = renderHookWithProvider(() => useRecipients(), mockState);

    expect(result.current).toEqual(mockAccountRecipients);
  });

  it('calls both useContactRecipients and useAccountRecipients hooks', () => {
    mockUseContactRecipients.mockReturnValue([]);
    mockUseAccountRecipients.mockReturnValue([]);

    renderHookWithProvider(() => useRecipients(), mockState);

    expect(mockUseContactRecipients).toHaveBeenCalledTimes(1);
    expect(mockUseAccountRecipients).toHaveBeenCalledTimes(1);
  });
});
