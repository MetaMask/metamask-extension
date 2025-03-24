import { Mockttp } from 'mockttp';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';

export async function mockRampsDynamicFeatureFlag(
  mockServer: Mockttp,
  subDomain: string,
) {
  return await mockServer
    .forGet(
      `https://on-ramp-content.${subDomain}.cx.metamask.io/regions/networks`,
    )
    .withQuery({
      context: 'extension',
    })
    .thenJson(200, {
      networks: [
        {
          active: true,
          chainId: MultichainNetworks.BITCOIN,
          chainName: 'Bitcoin',
          shortName: 'Bitcoin',
          nativeTokenSupported: true,
          isEvm: false,
        },
      ],
    });
}
