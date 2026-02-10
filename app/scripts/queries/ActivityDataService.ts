import { Messenger } from '@metamask/messenger';
import { BaseDataService } from './BaseDataService';

const serviceName = 'ActivityDataService';

type ExampleMessenger = Messenger<typeof serviceName, any, any>;

export class ActivityDataService extends BaseDataService<
  typeof serviceName,
  ExampleMessenger
> {
  #baseUrl = 'https://accounts.api.cx.metamask.io';

  constructor(messenger: ExampleMessenger) {
    super({
      name: serviceName,
      messenger,
    });

    messenger.registerActionHandler(
      `${this.name}:getActivity`,
      // @ts-expect-error TODO.
      this.getActivity.bind(this),
    );
  }

  async getActivity(address: string, options: any) {
    return this.fetchInfiniteQuery({
      queryKey: [`${this.name}:getActivity`, address],
      queryFn: async ({ pageParam }) => {
        const caipAddress = `eip155:0:${address.toLowerCase()}`;
        const url = new URL(
          `${this.#baseUrl}/v4/multiaccount/transactions?limit=10&accountAddresses=${caipAddress}`,
        );

        if (pageParam) {
          url.searchParams.set('cursor', pageParam);
        }

        const response = await fetch(url);

        return response.json();
      },
      getNextPageParam: ({ pageInfo }: { pageInfo: any }) =>
        pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
    });
  }
}
