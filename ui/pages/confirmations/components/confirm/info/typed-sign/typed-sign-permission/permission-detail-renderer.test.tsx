import { DecodedPermission } from '@metamask/gator-permissions-controller';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';

import { getMockTypedSignPermissionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import {
  renderWithConfirmContextProvider,
  renderWithConfirmContext,
} from '../../../../../../../../test/lib/confirmations/render-helpers';
import { enLocale as messages } from '../../../../../../../../test/lib/i18n-helpers';
import { fetchErc20DecimalsOrThrow } from '../../../../../utils/token';
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

const mockFetchErc20DecimalsOrThrow =
  fetchErc20DecimalsOrThrow as jest.MockedFunction<
    typeof fetchErc20DecimalsOrThrow
  >;

const getMockStore = (permission?: DecodedPermission) => {
  const state = getMockTypedSignPermissionConfirmState(permission);
  return configureMockStore([])(state);
};

const STREAM_PERMISSION = {
  type: 'native-token-stream',
  data: {
    initialAmount: '0x1234',
    maxAmount: '0x1234',
    amountPerSecond: '0x1234',
    startTime: 123456789,
  },
};
const ERC20_STREAM_PERMISSION = {
  ...STREAM_PERMISSION,
  type: 'erc20-token-stream',
  data: {
    tokenAddress: '0xa0b86a33e6441b8c4c8c0e4a8e4a8e4a8e4a8e4a',
    ...STREAM_PERMISSION.data,
  },
};
const RULE_ADDRESS = '0xb552685e3d2790efd64a175b00d51f02cdafee5d';

function renderPermissionDetail(
  props: Partial<React.ComponentProps<typeof PermissionDetailRenderer>> = {},
) {
  return renderWithConfirmContextProvider(
    <PermissionDetailRenderer
      permission={STREAM_PERMISSION}
      expiry={123456789}
      chainId="0x1"
      origin="https://example.com"
      ownerId="test-owner"
      {...props}
    />,
    getMockStore(),
  );
}

describe('PermissionDetailRenderer', () => {
  beforeEach(() => {
    mockFetchErc20DecimalsOrThrow.mockReset();
    mockFetchErc20DecimalsOrThrow.mockResolvedValue(18);
  });

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

  describe('native-token-allowance', () => {
    const permission = {
      type: 'native-token-allowance',
      data: {
        allowanceAmount: '0x1234',
        startTime: 123456789,
      },
    };

    it('renders the allowance details section', async () => {
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
      await waitFor(() => {
        expect(
          getByTestId('native-token-allowance-details-section'),
        ).toBeInTheDocument();
      });
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

  describe('erc20-token-allowance', () => {
    const permission = {
      type: 'erc20-token-allowance',
      data: {
        tokenAddress: '0xA0b86a33E6441b8c4C8C0E4A8e4A8e4A8e4A8e4A',
        allowanceAmount: '0x1234',
        startTime: 123456789,
      },
    };

    it('renders the allowance details section while token metadata loads', () => {
      mockFetchErc20DecimalsOrThrow.mockImplementationOnce(
        () => new Promise(() => undefined),
      );

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
        getByTestId('erc20-token-allowance-details-section'),
      ).toBeInTheDocument();
    });
  });

  describe('token-approval-revocation', () => {
    it('renders the revocation details section', () => {
      const permission = {
        type: 'token-approval-revocation',
        data: {
          erc20Approve: true,
          erc721Approve: true,
          erc721SetApprovalForAll: true,
          permit2Approve: true,
          permit2Lockdown: true,
          permit2InvalidateNonces: true,
        },
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
        getByTestId('token-approval-revocation-details-section'),
      ).toBeInTheDocument();
    });

    it('renders the all-primitives text when all revocation primitives are enabled', () => {
      const permission = {
        type: 'token-approval-revocation',
        data: {
          erc20Approve: true,
          erc721Approve: true,
          erc721SetApprovalForAll: true,
          permit2Approve: true,
          permit2Lockdown: true,
          permit2InvalidateNonces: true,
        },
      };
      const { getByText, queryByText } = renderWithConfirmContextProvider(
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
        getByText(
          messages.gatorPermissionsAllTokenApprovalRevocationPrimitives.message,
        ),
      ).toBeInTheDocument();
      expect(
        queryByText(messages.gatorPermissionsErc20ApproveRevocation.message),
      ).not.toBeInTheDocument();
    });

    it('renders the revocation method list when non-primitive methods are enabled', () => {
      const permission = {
        type: 'token-approval-revocation',
        data: {
          erc20Approve: true,
          erc721Approve: true,
          erc721SetApprovalForAll: true,
          permit2Approve: true,
        },
      };
      const { getByText, queryByText } = renderWithConfirmContextProvider(
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
        getByText(messages.gatorPermissionsPermit2ApproveRevocation.message),
      ).toBeInTheDocument();
      expect(
        queryByText(
          messages.gatorPermissionsAllTokenApprovalRevocationPrimitives.message,
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('throws if throwIfUnknown is true on unknown permission type', () => {
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
      ).toThrow('Unknown permission type: invalid');
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

  describe('recipient redeemer and Snap origin presentation', () => {
    it('shows the recipient row when `to` is supplied', async () => {
      renderPermissionDetail({
        to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      });

      await waitFor(() => {
        expect(
          screen.getByText(messages.recipient.message),
        ).toBeInTheDocument();
      });
    });

    for (const [ruleType, label] of [
      ['redeemer', messages.redeemer.message],
      ['payee', messages.payee.message],
    ] as const) {
      it(`lists ${ruleType} addresses from rules`, async () => {
        renderPermissionDetail({
          permission: ERC20_STREAM_PERMISSION,
          rules: [{ type: ruleType, data: { addresses: [RULE_ADDRESS] } }],
        });

        await waitFor(() => {
          expect(screen.getByText(label)).toBeInTheDocument();
        });
      });
    }

    it('uses the Snap-specific request-from tooltip when origin is a Snap id', async () => {
      renderPermissionDetail({
        origin: 'npm:@metamask/test-snap',
        ownerId: 'test-owner-snap-origin',
      });

      await waitFor(() => {
        expect(
          screen.getByText(messages.requestFrom.message),
        ).toBeInTheDocument();
      });
      expect(
        document.querySelector(
          `[data-original-title="${messages.requestFromInfoSnap.message}"]`,
        ),
      ).toBeTruthy();
      expect(screen.getByText('@metamask/test-snap')).toBeInTheDocument();
    });
  });
});
