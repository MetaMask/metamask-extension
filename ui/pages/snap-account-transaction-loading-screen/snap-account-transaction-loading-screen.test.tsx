import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../shared/constants/metametrics';
import SnapAccountTransactionLoadingScreen from './snap-account-transaction-loading-screen';

const SNAP_ID = 'npm:@metamask/test-snap';
const SNAP_NAME = 'Test Snap';

function buildAccount(snap?: { id: string }): InternalAccount {
  return {
    id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    address: '0x0000000000000000000000000000000000000000',
    type: EthAccountType.Eoa,
    scopes: [EthScope.Eoa],
    options: {},
    methods: [],
    metadata: {
      name: '',
      keyring: { type: 'Snap Keyring' },
      importTime: 0,
      ...(snap && { snap }),
    },
  };
}

function buildStore(snapMetadata?: Record<string, { name: string }>) {
  return configureStore({
    metamask: {
      ...mockState.metamask,
      snaps: snapMetadata
        ? Object.fromEntries(
            Object.entries(snapMetadata).map(([id, { name }]) => [
              id,
              {
                id,
                manifest: { proposedName: name },
                localizationFiles: undefined,
                enabled: true,
              },
            ]),
          )
        : {},
    },
  });
}

function createMockMetaMetricsContext() {
  const mockTrackEvent = jest.fn();
  return {
    context: {
      trackEvent: mockTrackEvent,
      bufferedTrace: jest.fn(),
      bufferedEndTrace: jest.fn(),
      onboardingParentContext: { current: null },
    },
    mockTrackEvent,
  };
}

describe('<SnapAccountTransactionLoadingScreen />', () => {
  it('renders the loading message', () => {
    const { context } = createMockMetaMetricsContext();
    const { container } = renderWithProvider(
      <MetaMetricsContext.Provider value={context}>
        <SnapAccountTransactionLoadingScreen
          internalAccount={buildAccount({ id: SNAP_ID })}
        />
      </MetaMetricsContext.Provider>,
      buildStore({ [SNAP_ID]: { name: SNAP_NAME } }),
    );

    expect(container).toHaveTextContent(/loading|wait|please/iu);
  });

  it('tracks the loading-viewed event with the resolved snap name when snap metadata is available', () => {
    const { context, mockTrackEvent } = createMockMetaMetricsContext();
    renderWithProvider(
      <MetaMetricsContext.Provider value={context}>
        <SnapAccountTransactionLoadingScreen
          internalAccount={buildAccount({ id: SNAP_ID })}
        />
      </MetaMetricsContext.Provider>,
      buildStore({ [SNAP_ID]: { name: SNAP_NAME } }),
    );

    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: MetaMetricsEventName.SnapAccountTransactionLoadingViewed,
      category: MetaMetricsEventCategory.Transactions,
      // The metrics schema uses snake_case keys, mirrored from the source.
      /* eslint-disable @typescript-eslint/naming-convention */
      properties: {
        snap_id: SNAP_ID,
        snap_name: SNAP_NAME,
        account_type: MetaMetricsEventAccountType.Snap,
      },
      /* eslint-enable @typescript-eslint/naming-convention */
    });
  });

  it('falls back to the stripped snap id when snap metadata is missing', () => {
    const { context, mockTrackEvent } = createMockMetaMetricsContext();
    renderWithProvider(
      <MetaMetricsContext.Provider value={context}>
        <SnapAccountTransactionLoadingScreen
          internalAccount={buildAccount({ id: SNAP_ID })}
        />
      </MetaMetricsContext.Provider>,
      buildStore(),
    );

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        // The metrics schema uses snake_case keys, mirrored from the source.
        /* eslint-disable @typescript-eslint/naming-convention */
        properties: expect.objectContaining({
          snap_id: SNAP_ID,
          // `getSnapName` strips the `npm:` prefix when no metadata is found.
          snap_name: '@metamask/test-snap',
        }),
        /* eslint-enable @typescript-eslint/naming-convention */
      }),
    );
  });

  it('omits snap_id and snap_name when the account has no snap metadata', () => {
    const { context, mockTrackEvent } = createMockMetaMetricsContext();
    renderWithProvider(
      <MetaMetricsContext.Provider value={context}>
        <SnapAccountTransactionLoadingScreen internalAccount={buildAccount()} />
      </MetaMetricsContext.Provider>,
      buildStore(),
    );

    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: MetaMetricsEventName.SnapAccountTransactionLoadingViewed,
      category: MetaMetricsEventCategory.Transactions,
      // The metrics schema uses snake_case keys, mirrored from the source.
      /* eslint-disable @typescript-eslint/naming-convention */
      properties: {
        snap_id: undefined,
        snap_name: undefined,
        account_type: MetaMetricsEventAccountType.Snap,
      },
      /* eslint-enable @typescript-eslint/naming-convention */
    });
  });
});
