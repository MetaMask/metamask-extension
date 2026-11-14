/* eslint-disable @typescript-eslint/naming-convention -- expected analytics property keys */
import { createEventBuilder } from '../../../shared/lib/analytics/create-event-builder';
import {
  MetaMetricsEventName,
  NetworkEditedField,
  NetworkManagementEntryPoint,
  NetworkManagementSource,
} from '../../../shared/constants/metametrics';
import {
  getChangedNetworkFields,
  trackNetworkAdded,
  trackRpcRemoved,
} from './network-management-metrics';

const createAnalytics = () => {
  const trackEvent = jest.fn();

  return { trackEvent, createEventBuilder };
};

describe('network management metrics', () => {
  it('lists only the fields that changed', () => {
    expect(
      getChangedNetworkFields(
        {
          name: 'Old',
          chainId: '0x1',
          nativeCurrency: 'ETH',
          rpcEndpoints: [{ url: 'https://rpc.example' }],
          defaultRpcEndpointIndex: 0,
          blockExplorerUrls: ['https://explorer.example'],
        },
        {
          name: 'New',
          chainId: '0x1',
          nativeCurrency: 'ETH',
          rpcEndpoints: [{ url: 'https://rpc.example' }],
          defaultRpcEndpointIndex: 0,
          blockExplorerUrls: [],
        },
      ),
    ).toStrictEqual([NetworkEditedField.Name, NetworkEditedField.Explorer]);
  });

  it('omits unset properties and never includes an RPC URL', () => {
    const analytics = createAnalytics();

    trackRpcRemoved(analytics, {
      rpcCount: 1,
      wasActive: true,
      entryPoint: NetworkManagementEntryPoint.NetworkPicker,
    });

    const payload = analytics.trackEvent.mock.calls[0][0];
    expect(payload.name).toBe(MetaMetricsEventName.RpcRemoved);
    expect(payload.properties).toStrictEqual({
      category: 'Network',
      rpc_count: 1,
      was_active: true,
      entry_point: 'network_picker',
    });
    expect(JSON.stringify(payload)).not.toContain('http');
  });

  it('records a saved network without its name or RPC URL', () => {
    const analytics = createAnalytics();

    trackNetworkAdded(analytics, {
      chainId: '0x89',
      source: NetworkManagementSource.Manual,
      entryPoint: NetworkManagementEntryPoint.SettingsNetworks,
      rpcCount: 2,
      blockExplorerSet: false,
    });

    expect(analytics.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.NetworkAdded,
        properties: expect.objectContaining({
          chain_id: '0x89',
          source: 'manual',
          rpc_count: 2,
          block_explorer_set: false,
        }),
      }),
    );
  });
});
