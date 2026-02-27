import { Messenger } from '@metamask/messenger';
import { BaseDataService } from '@metamask-previews/base-data-service';
import { Duration, inMilliseconds, Json } from '@metamask/utils';

const serviceName = 'ActivityDataService';

type ExampleMessenger = Messenger<typeof serviceName, any, any>;

export type GetActivityResponse = {
  data: Json[];
  pageInfo: {
    count: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  };
};

export type PageParam =
  | {
      before: string;
    }
  | { after: string };

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

  async getActivity(address: string, page?: PageParam) {
    return this.fetchInfiniteQuery<GetActivityResponse>(
      {
        queryKey: [`${this.name}:getActivity`, address],
        queryFn: async ({ pageParam }) => {
          const caipAddress = `eip155:0:${address.toLowerCase()}`;
          const url = new URL(
            `${this.#baseUrl}/v4/multiaccount/transactions?limit=10&accountAddresses=${caipAddress}`,
          );

          if (pageParam?.after) {
            url.searchParams.set('after', pageParam.after);
          } else if (pageParam?.before) {
            url.searchParams.set('before', pageParam.before);
          }

          const response = await fetch(url);

          return response.json();
        },
        getPreviousPageParam: ({ pageInfo }) =>
          pageInfo.hasPreviousPage
            ? { before: pageInfo.startCursor }
            : undefined,
        getNextPageParam: ({ pageInfo }) =>
          pageInfo.hasNextPage ? { after: pageInfo.endCursor } : undefined,
        staleTime: inMilliseconds(5, Duration.Minute),
      },
      page,
    );
  }
}
