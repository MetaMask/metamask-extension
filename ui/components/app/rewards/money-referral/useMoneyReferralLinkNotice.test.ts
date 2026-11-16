import { it } from '@jest/globals';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  getMoneyReferralLinkNotice,
  useMoneyReferralLinkNotice,
} from './useMoneyReferralLinkNotice';

const notice = {
  title: 'rewardsMoneyReferralLinkTitle',
  description: 'rewardsMoneyReferralLinkDescription',
};

describe('getMoneyReferralLinkNotice', () => {
  it.each(['?ref=ABCD12', '?ref=%20abcd12%20'])(
    'describes a link with a valid referral code: %s',
    (query) => {
      expect(
        getMoneyReferralLinkNotice(
          new URL(`https://link.metamask.io/home${query}`),
        ),
      ).toStrictEqual(notice);
    },
  );

  it.each([
    ['no ref', ''],
    ['a short ref', '?ref=ab'],
    ['a malformed ref', '?ref=AB!'],
    ['a duplicate ref', '?ref=ABC&ref=DEF'],
  ])('ignores a link with %s', (_, query) => {
    expect(
      getMoneyReferralLinkNotice(
        new URL(`https://link.metamask.io/home${query}`),
      ),
    ).toBeNull();
  });
});

describe('useMoneyReferralLinkNotice', () => {
  function renderNotice({
    enabled = true,
    useExternalServices = true,
  }: { enabled?: boolean; useExternalServices?: boolean } = {}) {
    return renderHookWithProvider(() => useMoneyReferralLinkNotice(), {
      metamask: {
        useExternalServices,
        remoteFeatureFlags: {
          rewardsMoneyControllerEnabled: { enabled, minimumVersion: '0.0.0' },
        },
      },
    }).result.current;
  }

  it('returns the resolver when the referral invite can open', () => {
    expect(renderNotice()).toBe(getMoneyReferralLinkNotice);
  });

  it.each([
    ['the referral flag is off', { enabled: false }],
    ['Basic Functionality is off', { useExternalServices: false }],
  ])('returns undefined when %s', (_, options) => {
    expect(renderNotice(options)).toBeUndefined();
  });
});
