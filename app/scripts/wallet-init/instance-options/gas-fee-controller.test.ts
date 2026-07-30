import { CHAIN_IDS } from '../../../../shared/constants/network';
import { SWAPS_CLIENT_ID } from '../../../../shared/constants/swaps';
import { createMockMessenger } from '../test-utils';
import { getGasFeeControllerInitMessenger } from '../messengers/gas-fee-controller-messenger';
import { getGasFeeControllerInstanceOptions } from './gas-fee-controller';

function buildOptions(chainId: string = CHAIN_IDS.MAINNET) {
  const rootMessenger = createMockMessenger();

  rootMessenger.registerActionHandler(
    'NetworkController:getState',
    () => ({ selectedNetworkClientId: 'test-network-client-id' }) as never,
  );
  rootMessenger.registerActionHandler(
    'NetworkController:getNetworkClientById',
    () => ({ configuration: { chainId } }) as never,
  );

  const initMessenger = getGasFeeControllerInitMessenger(rootMessenger);

  return getGasFeeControllerInstanceOptions({ initMessenger });
}

describe('GasFeeController wallet instance options', () => {
  it('overrides the client ID and poll interval', () => {
    const options = buildOptions();

    expect(options.clientId).toBe(SWAPS_CLIENT_ID);
    expect(options.interval).toBe(10_000);
  });

  it('supplies the gas API endpoints', () => {
    const options = buildOptions();

    expect(options.legacyAPIEndpoint).toContain(
      '/networks/<chain_id>/gasPrices',
    );
    expect(options.EIP1559APIEndpoint).toContain(
      '/networks/<chain_id>/suggestedGasFees',
    );
  });

  it('reports legacy gas API compatibility only for BSC', () => {
    expect(
      buildOptions(
        CHAIN_IDS.BSC,
      ).getCurrentNetworkLegacyGasAPICompatibility?.(),
    ).toBe(true);
    expect(
      buildOptions(
        CHAIN_IDS.MAINNET,
      ).getCurrentNetworkLegacyGasAPICompatibility?.(),
    ).toBe(false);
  });
});
