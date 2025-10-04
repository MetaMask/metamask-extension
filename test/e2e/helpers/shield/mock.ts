import { Mockttp } from 'mockttp';

const SHIELD_SERVER_SUBSCRIPTION_PATH =
  'https://subscription.dev-api.cx.metamask.io/v1/subscriptions';

// Mock Shield Server
export class ShieldMockttpService {
  setup(server: Mockttp) {
    server
      .forGet(SHIELD_SERVER_SUBSCRIPTION_PATH)
      .always()
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            subscriptions: [],
            trialedProducts: [],
          },
        };
      });
  }
}
