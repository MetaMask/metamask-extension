import { Messenger } from '@metamask/messenger';
import { BaseDataService } from './BaseDataService';

const serviceName = 'AssetDataService';

type ExampleMessenger = Messenger<typeof serviceName, any, any>;

export class AssetDataService extends BaseDataService<
  typeof serviceName,
  ExampleMessenger
> {
  #baseUrl = 'https://tokens.api.cx.metamask.io';

  constructor(messenger: ExampleMessenger) {
    super({
      name: serviceName,
      messenger,
    });

    messenger.registerActionHandler(
      `${this.name}:getAssets`,
      // @ts-expect-error TODO.
      this.getAssets.bind(this),
    );
  }

  async getAssets(assets: string[]) {
    return this.fetchQuery({
      queryKey: [`${this.name}:getAssets`, ...assets],
      queryFn: async ({ pageParam }) => {
        const url = new URL(
          `${this.#baseUrl}/v3/assets?assetIds=${assets.join(',')}`,
        );

        const response = await fetch(url);

        return response.json();
      },
    });
  }
}
