import React from 'react';
import { it } from '@jest/globals';
import { act, fireEvent, screen } from '@testing-library/react';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import configureStore from '../../../store/store';
import * as actions from '../../../store/actions';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../test/lib/i18n-helpers';
import QRHardwarePopover from './qr-hardware-popover';

let mockImportReady: Promise<void>;
let mockFinishImport: () => void;

jest.mock('../../../helpers/utils/mm-lazy', () => {
  const actual = jest.requireActual<
    typeof import('../../../helpers/utils/mm-lazy')
  >('../../../helpers/utils/mm-lazy');
  return {
    ...actual,
    mmLazy: (loader: () => Promise<Record<PropertyKey, unknown>>) =>
      actual.mmLazy(async () => {
        await mockImportReady;
        return loader();
      }),
  };
});

jest.mock('../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: () => 'fullscreen',
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  cancelQrCodeScan: jest.fn(() => ({ type: 'TEST_CANCEL_QR_SCAN' })),
  rejectPendingApproval: jest.fn(() => ({ type: 'TEST_REJECT_APPROVAL' })),
  cancelTx: jest.fn(() => ({ type: 'TEST_CANCEL_TX' })),
}));

jest.mock('./qr-hardware-wallet-importer', () => {
  const MockImporter = () => <div data-testid="loaded-qr-content" />;
  MockImporter.displayName = 'MockImporter';
  return MockImporter;
});

jest.mock('./qr-hardware-sign-request', () => {
  const MockSigner = () => <div data-testid="loaded-qr-content" />;
  MockSigner.displayName = 'MockSigner';
  return MockSigner;
});

describe('QR hardware cancellation during loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockImportReady = new Promise((resolve) => {
      mockFinishImport = resolve;
    });
  });

  it.each([QrScanRequestType.PAIR, QrScanRequestType.SIGN])(
    'cancels a %s request before its UI chunk finishes loading',
    async (type) => {
      const txData = { id: 'pending-tx-id' };
      const store = configureStore({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          activeQrCodeScanRequest: {
            type,
            request: { requestId: 'pending-request-id', payload: {} },
          },
        },
        confirmTransaction: { txData },
      });
      const { unmount } = renderWithProvider(<QRHardwarePopover />, store);

      expect(screen.queryByTestId('loaded-qr-content')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: tEn('close') }));

      expect(actions.cancelQrCodeScan).toHaveBeenCalledWith(undefined);
      if (type === QrScanRequestType.SIGN) {
        expect(actions.rejectPendingApproval).toHaveBeenCalledWith(
          txData.id,
          expect.objectContaining({ code: 4001 }),
        );
        expect(actions.cancelTx).toHaveBeenCalledWith(txData);
      } else {
        expect(actions.rejectPendingApproval).not.toHaveBeenCalled();
        expect(actions.cancelTx).not.toHaveBeenCalled();
      }

      // Model dismissal before completing the import; flush its pending work.
      unmount();
      await act(async () => mockFinishImport());
    },
  );
});
