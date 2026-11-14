import { asset } from './asset';
import { batchSell } from './batch-sell';
import { buy } from './buy';
import { card } from './card';
import { home } from './home';
import { nfts } from './nfts';
import { notifications } from './notifications';
import { notificationsSettings } from './notifications-settings';
import { onboarding } from './onboarding';
import { money } from './money';
import { moneyAccountDeposit } from './money-account-deposit';
import { musd } from './musd';
import { perps } from './perps';
import { perpsAsset } from './perps-asset';
import { perpsMarkets } from './perps-markets';
import { predict } from './predict';
import { privacy } from './privacy';
import { rewards } from './rewards';
import { addRoute } from './route-registry';
import { sell } from './sell';
import { shield } from './shield';
import { swap } from './swap';
import { topTraders } from './top-traders';
import { trending } from './trending';

export type { Route } from './route';
export { addRoute, matchRoute, routes } from './route-registry';

if (process.env.ENABLE_SETTINGS_PAGE_DEV_OPTIONS || process.env.IN_TEST) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  addRoute(require('./test-route').test);
}

addRoute(buy);
addRoute(batchSell);
addRoute(sell);
addRoute(card);
addRoute(home);
addRoute(nfts);
addRoute(notifications);
addRoute(notificationsSettings);
addRoute(onboarding);
addRoute(swap);
addRoute(money);
addRoute(moneyAccountDeposit);
addRoute(musd);
addRoute(perps);
addRoute(perpsAsset);
addRoute(perpsMarkets);
addRoute(predict);
addRoute(privacy);
addRoute(rewards);
addRoute(shield);
addRoute(asset);
addRoute(topTraders);
addRoute(trending);
