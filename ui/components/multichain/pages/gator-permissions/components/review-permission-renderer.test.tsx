import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { Settings } from 'luxon';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { ReviewPermissionRenderer } from './review-permission-renderer';

const store = configureStore(mockState);

const ACCOUNT_ADDRESS = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
const RULE_ADDRESS = '0x0000000000000000000000000000000000000001';
const STREAM_PERMISSION_DATA = {
  initialAmount: '0x6f05b59d3b20000',
  maxAmount: '0x22b1c8c1227a0000',
  amountPerSecond: '0x6f05b59d3b20000',
  startTime: 1736271776,
};
const PERIODIC_PERMISSION_DATA = {
  periodAmount: '0xde0b6b3a7640000',
  periodDuration: 86400,
  startTime: 1736271776,
};

jest.mock('../../../../app/modals/nickname-popovers', () => {
  return function mockNicknamePopovers() {
    return <div data-testid="nickname-popovers" />;
  };
});

function renderReviewPermissionRenderer(
  props: Partial<React.ComponentProps<typeof ReviewPermissionRenderer>> = {},
) {
  return renderWithProvider(
    <ReviewPermissionRenderer
      permissionType="native-token-stream"
      permissionData={STREAM_PERMISSION_DATA}
      chainId="0x1"
      tokenInfo={{ symbol: 'ETH', decimals: 18 }}
      tokenLoading={false}
      {...props}
    />,
    store,
  );
}

describe('ReviewPermissionRenderer', () => {
  beforeAll(() => {
    Settings.defaultZone = 'utc';
    Settings.now = () => new Date('2025-01-01T00:00:00Z').getTime();
  });

  afterAll(() => {
    Settings.defaultZone = 'system';
    Settings.now = () => Date.now();
  });

  it('renders mapped stream fields and expiry from rules', () => {
    const mockExpiryTimestamp = 1767225600;

    renderWithProvider(
      <ReviewPermissionRenderer
        permissionType="native-token-stream"
        permissionData={{
          initialAmount: '0x6f05b59d3b20000',
          maxAmount: '0x22b1c8c1227a0000',
          amountPerSecond: '0x6f05b59d3b20000',
          startTime: 1736271776,
        }}
        chainId="0x1"
        rules={[
          {
            type: 'expiry',
            data: { timestamp: mockExpiryTimestamp },
          },
        ]}
        tokenInfo={{ symbol: 'ETH', decimals: 18 }}
        tokenLoading={false}
      />,
      store,
    );

    expect(
      screen.getByTestId('review-gator-permission-initial-allowance'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('review-gator-permission-stream-rate'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('review-gator-permission-expiration-date'),
    ).toBeInTheDocument();
  });

  it('ignores confirmation-only divider rows in reviewDetail', () => {
    expect(() =>
      renderReviewPermissionRenderer({
        permissionType: 'token-approval-revocation',
        permissionData: { erc20Approve: true },
      }),
    ).not.toThrow();

    expect(
      screen.getByTestId('review-gator-permission-revocation-methods'),
    ).toBeInTheDocument();
  });

  it('renders justification as a plain string when provided', () => {
    renderReviewPermissionRenderer({
      permissionData: {
        ...STREAM_PERMISSION_DATA,
        justification: 'Project payroll',
      },
    });

    expect(
      screen.getByTestId('review-gator-permission-justification'),
    ).toHaveTextContent('Project payroll');
  });

  it('shows no expiration label when expiry is absent from rules', () => {
    renderReviewPermissionRenderer({ rules: [] });

    expect(
      screen.getByTestId('review-gator-permission-expiration-date'),
    ).toHaveTextContent('No expiration');
  });

  it('renders periodic reviewSummary amount, frequency text, and account row', () => {
    renderReviewPermissionRenderer({
      permissionType: 'native-token-periodic',
      permissionData: PERIODIC_PERMISSION_DATA,
      rules: [],
      viewMode: 'reviewSummary',
      permissionAccount: ACCOUNT_ADDRESS,
    });

    expect(
      screen.getByTestId('review-gator-permission-amount-label'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('review-gator-permission-frequency-label'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('review-gator-permission-account-name'),
    ).toBeInTheDocument();
  });

  it('renders network, redeemer, and payee rows when rules are present', () => {
    renderReviewPermissionRenderer({
      rules: [
        { type: 'redeemer', data: { addresses: [RULE_ADDRESS] } },
        { type: 'payee', data: { addresses: [RULE_ADDRESS] } },
      ],
      networkName: 'Ethereum Mainnet',
    });

    expect(
      screen.getByTestId('review-gator-permission-network-name'),
    ).toHaveTextContent('Ethereum Mainnet');
    expect(screen.getByText(messages.redeemer.message)).toBeInTheDocument();
    expect(screen.getByText(messages.payee.message)).toBeInTheDocument();
    expect(
      screen.getAllByTestId('review-gator-permission-rule-address'),
    ).toHaveLength(2);
  });

  it('does not open nickname popover from copy buttons', () => {
    const { unmount } = renderReviewPermissionRenderer({
      permissionType: 'native-token-periodic',
      permissionData: PERIODIC_PERMISSION_DATA,
      rules: [],
      viewMode: 'reviewSummary',
      permissionAccount: ACCOUNT_ADDRESS,
    });

    fireEvent.click(screen.getByLabelText('copy-button'));
    expect(screen.queryByTestId('nickname-popovers')).not.toBeInTheDocument();
    unmount();

    renderReviewPermissionRenderer({
      rules: [{ type: 'redeemer', data: { addresses: [RULE_ADDRESS] } }],
    });
    fireEvent.click(screen.getByLabelText('copy-button'));
    expect(screen.queryByTestId('nickname-popovers')).not.toBeInTheDocument();
  });

  it('places /sec before (raw units) when token decimals are unknown', () => {
    renderWithProvider(
      <ReviewPermissionRenderer
        permissionType="native-token-stream"
        permissionData={{
          initialAmount: '0x6f05b59d3b20000',
          maxAmount: '0x22b1c8c1227a0000',
          amountPerSecond: '0x6f05b59d3b20000',
          startTime: 1736271776,
        }}
        chainId="0x1"
        tokenInfo={{ symbol: 'ETH', decimals: undefined }}
        tokenLoading={false}
      />,
      store,
    );

    const streamRate = screen.getByTestId(
      'review-gator-permission-stream-rate',
    );
    expect(streamRate).toHaveTextContent(
      '500000000000000000 ETH/sec (raw units)',
    );
    expect(streamRate.textContent).not.toContain('(raw units)/sec');
  });

  it('falls back to unknown schema for unknown permission types', () => {
    expect(() =>
      renderReviewPermissionRenderer({
        permissionType: 'invalid-permission-type',
        permissionData: {},
        viewMode: 'reviewSummary',
      }),
    ).not.toThrow();

    expect(
      screen.getByText(messages.unknownPermissionType.message),
    ).toBeInTheDocument();
    expect(screen.getByText('invalid-permission-type')).toBeInTheDocument();
  });
});
