import React from 'react';
import { screen } from '@testing-library/react';
import { Settings } from 'luxon';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { ReviewPermissionRenderer } from './review-permission-renderer';

const store = configureStore(mockState);

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
        expiry={null}
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

  it('uses rules expiry for stream total exposure when expiry prop is null', () => {
    renderWithProvider(
      <ReviewPermissionRenderer
        permissionType="native-token-stream"
        permissionData={{
          initialAmount: '0x0',
          maxAmount: '0x100',
          amountPerSecond: '0x1',
          startTime: 1000,
        }}
        chainId="0x1"
        expiry={null}
        rules={[
          {
            type: 'expiry',
            data: { timestamp: 1100 },
          },
        ]}
        tokenInfo={{ symbol: 'ETH', decimals: 0 }}
        tokenLoading={false}
        viewMode="confirmation"
      />,
      store,
    );

    const totalExposure = screen.getByTestId('confirmation-total-exposure');
    expect(totalExposure).toHaveTextContent('100 ETH');
    expect(totalExposure.textContent).not.toContain('256');
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
        expiry={null}
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
});
