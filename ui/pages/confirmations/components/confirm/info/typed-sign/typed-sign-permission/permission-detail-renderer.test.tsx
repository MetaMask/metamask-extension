import { DecodedPermission } from '@metamask/gator-permissions-controller';
import React from 'react';
import { waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';

import { getMockTypedSignPermissionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import {
  renderWithConfirmContextProvider,
  renderWithConfirmContext,
} from '../../../../../../../../test/lib/confirmations/render-helpers';
import { enLocale as messages } from '../../../../../../../../test/lib/i18n-helpers';
import { PermissionDetailRenderer } from './permission-detail-renderer';

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../../utils/token', () => ({
  ...jest.requireActual('../../../../../utils/token'),
  fetchErc20DecimalsOrThrow: jest.fn().mockResolvedValue(18),
}));

const getMockStore = (permission?: DecodedPermission) => {
  const state = getMockTypedSignPermissionConfirmState(permission);
  return configureMockStore([])(state);
};

describe('PermissionDetailRenderer', () => {
  describe('native-token-periodic', () => {
    const permission = {
      type: 'native-token-periodic',
      data: {
        periodAmount: '0x1234',
        periodDuration: 86400,
        startTime: 123456789,
      },
    };

    it('renders the periodic details section', () => {
      const { getByTestId, queryByTestId } = renderWithConfirmContextProvider(
        <PermissionDetailRenderer
          permission={permission}
          expiry={123456789}
          chainId="0x1"
          origin="https://example.com"
          ownerId="test-id"
        />,
        getMockStore(),
      );
      expect(
        getByTestId('native-token-periodic-details-section'),
      ).toBeInTheDocument();
      expect(
        queryByTestId('review_summary-account-section'),
      ).not.toBeInTheDocument();
    });

    it('renders without expiry', () => {
      const { getByTestId } = renderWithConfirmContextProvider(
        <PermissionDetailRenderer
          permission={permission}
          expiry={null}
          chainId="0x1"
          origin="https://example.com"
          ownerId="test-id"
        />,
        getMockStore(),
      );
      const section = getByTestId('native-token-periodic-details-section');
      expect(section?.textContent).toContain('Never expires');
    });
  });

  describe('native-token-stream', () => {
    const permission = {
      type: 'native-token-stream',
      data: {
        initialAmount: '0x1234',
        maxAmount: '0x1234',
        amountPerSecond: '0x1234',
        startTime: 123456789,
      },
    };

    it('renders both sections', () => {
      const { getByTestId } = renderWithConfirmContextProvider(
        <PermissionDetailRenderer
          permission={permission}
          expiry={123456789}
          chainId="0x1"
          origin="https://example.com"
          ownerId="test-id"
        />,
        getMockStore(),
      );
      expect(
        getByTestId('native-token-stream-details-section'),
      ).toBeInTheDocument();
      expect(
        getByTestId('native-token-stream-stream-rate-section'),
      ).toBeInTheDocument();
    });

    it('hides initialAmount when not provided', () => {
      const permissionNoInitial = {
        ...permission,
        data: { ...permission.data, initialAmount: undefined },
      };
      const { getByTestId } = renderWithConfirmContextProvider(
        <PermissionDetailRenderer
          permission={permissionNoInitial}
          expiry={123456789}
          chainId="0x1"
          origin="https://example.com"
          ownerId="test-id"
        />,
        getMockStore(),
      );
      expect(
        getByTestId('native-token-stream-details-section'),
      ).toBeInTheDocument();
    });

    it('hides maxAmount when not provided', () => {
      const permissionNoMax = {
        ...permission,
        data: { ...permission.data, maxAmount: undefined },
      };
      const { getByTestId } = renderWithConfirmContextProvider(
        <PermissionDetailRenderer
          permission={permissionNoMax}
          expiry={123456789}
          chainId="0x1"
          origin="https://example.com"
          ownerId="test-id"
        />,
        getMockStore(),
      );
      expect(
        getByTestId('native-token-stream-details-section'),
      ).toBeInTheDocument();
    });

    it('shows finite total exposure from expiry (capped by maxAmount), not unlimited', async () => {
      const permissionCapped = {
        type: 'native-token-stream' as const,
        data: {
          initialAmount: '0x0',
          maxAmount: '0x100',
          amountPerSecond: '0x1',
          startTime: 1000,
        },
      };
      const { getByTestId, getByText, queryByText } =
        renderWithConfirmContextProvider(
          <PermissionDetailRenderer
            permission={permissionCapped}
            expiry={1100}
            chainId="0x1"
            origin="https://example.com"
            ownerId="test-id"
          />,
          getMockStore(),
        );
      expect(
        getByTestId('native-token-stream-stream-rate-section'),
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(
          getByText(messages.confirmFieldTotalExposure.message),
        ).toBeInTheDocument();
      });
      expect(queryByText(messages.unlimited.message)).not.toBeInTheDocument();
    });
  });

  describe('erc20-token-periodic', () => {
    const permission = {
      type: 'erc20-token-periodic',
      data: {
        tokenAddress: '0xA0b86a33E6441b8c4C8C0E4A8e4A8e4A8e4A8e4A',
        periodAmount: '0x1234',
        periodDuration: 604800,
        startTime: 123456789,
      },
    };

    it('renders the periodic details section', () => {
      const { getByTestId } = renderWithConfirmContextProvider(
        <PermissionDetailRenderer
          permission={permission}
          expiry={123456789}
          chainId="0x1"
          origin="https://example.com"
          ownerId="test-id"
        />,
        getMockStore(),
      );
      expect(
        getByTestId('erc20-token-periodic-details-section'),
      ).toBeInTheDocument();
    });
  });

  describe('erc20-token-stream', () => {
    const permission = {
      type: 'erc20-token-stream',
      data: {
        tokenAddress: '0xA0b86a33E6441b8c4C8C0E4A8e4A8e4A8e4A8e4A',
        initialAmount: '0x1234',
        maxAmount: '0x1234',
        amountPerSecond: '0x1234',
        startTime: 123456789,
      },
    };

    it('renders both sections', () => {
      const { getByTestId } = renderWithConfirmContextProvider(
        <PermissionDetailRenderer
          permission={permission}
          expiry={123456789}
          chainId="0x1"
          origin="https://example.com"
          ownerId="test-id"
        />,
        getMockStore(),
      );
      expect(
        getByTestId('erc20-token-stream-details-section'),
      ).toBeInTheDocument();
      expect(
        getByTestId('erc20-token-stream-stream-rate-section'),
      ).toBeInTheDocument();
    });
  });

  describe('erc20-token-revocation', () => {
    it('renders the revocation details section', () => {
      const permission = {
        type: 'erc20-token-revocation',
        data: {},
      };
      const { getByTestId } = renderWithConfirmContextProvider(
        <PermissionDetailRenderer
          permission={permission}
          expiry={null}
          chainId="0x1"
          origin="https://example.com"
          ownerId="test-id"
        />,
        getMockStore(),
      );
      expect(
        getByTestId('erc20-token-revocation-details-section'),
      ).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('throws on invalid permission type', () => {
      expect(() =>
        renderWithConfirmContext(
          <PermissionDetailRenderer
            permission={{ type: 'invalid', data: {} }}
            expiry={null}
            chainId="0x1"
            origin="https://example.com"
            ownerId="test-id"
          />,
          getMockStore(),
        ),
      ).toThrow('Invalid permission type: invalid');
    });

    it('throws when startTime is missing for periodic types', () => {
      expect(() =>
        renderWithConfirmContext(
          <PermissionDetailRenderer
            permission={{
              type: 'native-token-periodic',
              data: { periodAmount: '0x1', periodDuration: 86400 },
            }}
            expiry={null}
            chainId="0x1"
            origin="https://example.com"
            ownerId="test-id"
          />,
          getMockStore(),
        ),
      ).toThrow('Start time is required');
    });

    it('throws when startTime is missing for stream types', () => {
      expect(() =>
        renderWithConfirmContext(
          <PermissionDetailRenderer
            permission={{
              type: 'native-token-stream',
              data: { amountPerSecond: '0x1' },
            }}
            expiry={null}
            chainId="0x1"
            origin="https://example.com"
            ownerId="test-id"
          />,
          getMockStore(),
        ),
      ).toThrow('Start time is required');
    });
  });
});
