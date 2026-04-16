import React from 'react';
import { screen } from '@testing-library/react';
import { Settings } from 'luxon';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import type { PermissionSchemaEntry } from '../../../../../../shared/lib/gator-permissions/permission-detail-schema.types';
import { PERMISSION_SCHEMAS } from '../../../../../../shared/lib/gator-permissions/permission-detail-schemas';
import { ReviewPermissionRenderer } from './review-permission-renderer';

const store = configureStore(mockState);

const TEST_REVIEW_DETAIL_DIVIDER_TYPE = '__test_review_detail_divider__';

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

  it('skips divider in reviewDetail when schema lists it for that view (no throw)', () => {
    const entry: PermissionSchemaEntry = {
      tokenVariant: 'none',
      tokenResolution: { kind: 'none' },
      sections: [
        {
          testId: 'test-section-divider',
          elements: [{ type: 'divider', includeInViews: ['reviewDetail'] }],
        },
      ],
    };
    (PERMISSION_SCHEMAS as Record<string, PermissionSchemaEntry>)[
      TEST_REVIEW_DETAIL_DIVIDER_TYPE
    ] = entry;
    try {
      expect(() =>
        renderWithProvider(
          <ReviewPermissionRenderer
            permissionType={TEST_REVIEW_DETAIL_DIVIDER_TYPE}
            permissionData={{}}
            chainId="0x1"
            tokenInfo={{ symbol: 'ETH', decimals: 18 }}
            tokenLoading={false}
          />,
          store,
        ),
      ).not.toThrow();
    } finally {
      delete (PERMISSION_SCHEMAS as Record<string, PermissionSchemaEntry>)[
        TEST_REVIEW_DETAIL_DIVIDER_TYPE
      ];
    }
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
});
