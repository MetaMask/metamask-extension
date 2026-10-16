import { getRootMessenger } from '../lib/messenger';
import { buildControllerInitRequestMock } from './test/utils';
import { getNetworkPolicyControllerMessenger } from './messengers/network-policy-controller-messenger';
import { NetworkPolicyControllerInit } from './network-policy-controller-init';

describe('NetworkPolicyControllerInit', () => {
  it('restores the persisted policy and exposes the trusted UI action', async () => {
    const request = {
      ...buildControllerInitRequestMock(),
      controllerMessenger:
        getNetworkPolicyControllerMessenger(getRootMessenger()),
      initMessenger: undefined,
    };
    request.persistedState.NetworkPolicyController = {
      postOnboardingNetworkDomains: ['RPC.EXAMPLE'],
    };

    const result = NetworkPolicyControllerInit(request);

    expect(
      result.messengerClient.state.postOnboardingNetworkDomains,
    ).toStrictEqual(['rpc.example']);
    await result.api?.configurePostOnboardingNetworkDomains([
      'updated.example',
    ]);
    expect(request.applyNetworkPolicyDomains).toHaveBeenCalledWith(
      ['updated.example'],
      expect.any(Function),
    );
    expect(
      result.messengerClient.state.postOnboardingNetworkDomains,
    ).toStrictEqual(['updated.example']);
    expect(result.persistedStateKey).toBeUndefined();
  });
});
