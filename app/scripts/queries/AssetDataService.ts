import { Messenger } from '@metamask/messenger';
import { BaseDataService } from './BaseDataService';

const serviceName = 'AssetDataService';

type AssetDataServiceMessenger = Messenger<typeof serviceName, any, any>;

export class AssetDataService extends BaseDataService<
  typeof serviceName,
  AssetDataServiceMessenger
> {
  #baseUrl = 'https://tokens.api.cx.metamask.io';

  constructor(messenger: AssetDataServiceMessenger) {
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
    return this.fetch({
      key: [`${this.name}:getAssets`, assets],
      fn: async () => {
        const url = new URL(
          `${this.#baseUrl}/v3/assets?assetIds=${assets.join(',')}`,
        );

        const response = await fetch(url);

        return response.json();
      },
    });
  }
}
