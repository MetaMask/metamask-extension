import AccountListPage from '../page-objects/pages/accounts/list-page';
import ActivityTab from '../page-objects/pages/home/activity-tab';
import HomePage from '../page-objects/pages/home/homepage';
import { matchRoute } from './match-route';
import { NOT_A_SCREEN } from './route-registry';

describe('matchRoute', () => {
  it('matches static routes to their page object', () => {
    expect(matchRoute('/activity')).toStrictEqual({
      path: '/activity',
      pageObject: ActivityTab,
    });
    expect(matchRoute('/account-list')).toStrictEqual({
      path: '/account-list',
      pageObject: AccountListPage,
    });
  });

  it('matches the home route from "/" and an empty pathname', () => {
    expect(matchRoute('/')).toStrictEqual({ path: '/', pageObject: HomePage });
    expect(matchRoute('')).toStrictEqual({ path: '/', pageObject: HomePage });
  });

  it('matches dynamic and optional segments', () => {
    expect(matchRoute('/send')?.path).toBe('/send/:page?');
    expect(matchRoute('/send/amount')?.path).toBe('/send/:page?');
    expect(matchRoute('/tx/eip155:1/0xabc')?.path).toBe(
      '/tx/:caipChainId/:txIdentifier',
    );
  });

  it('prefers static segments over dynamic ones, like the router', () => {
    expect(matchRoute('/asset/image/0xabc/1')?.path).toBe(
      '/asset/image/:asset/:id',
    );
    expect(matchRoute('/asset/0x1/0xabc')?.path).toBe(
      '/asset/:chainId/:asset?/:id?',
    );
  });

  it('returns null for routes without a page object', () => {
    expect(matchRoute('/mfa')).toStrictEqual({
      path: '/mfa',
      pageObject: null,
    });
  });

  it('returns NOT_A_SCREEN for routes that render no screen', () => {
    expect(matchRoute('/lock')).toStrictEqual({
      path: '/lock',
      pageObject: NOT_A_SCREEN,
    });
  });

  it('returns undefined for paths that are not routes', () => {
    expect(matchRoute('/random')).toBeUndefined();
    expect(matchRoute('/settings/not-a-route')).toBeUndefined();
  });
});
