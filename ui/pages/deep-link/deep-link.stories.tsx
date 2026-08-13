import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ButtonLink } from '../../components/component-library';
import { useI18nContext } from '../../hooks/useI18nContext';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { DeepLink, DeepLinkView } from './deep-link';

type TranslateFunction = (
  key: string,
  substitutions?: (string | JSX.Element)[],
) => string;

const NOOP = () => undefined;

const meta: Meta<typeof DeepLink> = {
  title: 'Pages/DeepLink',
  component: DeepLink,
  parameters: {
    initialEntries: ['/?u=/home'],
  },
};

export default meta;
type Story = StoryObj<typeof DeepLink>;

const createRouteStory = (path: string, name?: string): Story => ({
  ...(name ? { name } : {}),
  parameters: {
    initialEntries: [
      `/?u=${path.includes('?') ? encodeURIComponent(path) : path}`,
    ],
  },
});

export const Default: Story = {};

export const Signed: Story = {
  render: function SignedStory() {
    const t = useI18nContext() as TranslateFunction;
    const [checked, setChecked] = useState(false);
    const pageName = t('deepLink_theHomePage');

    return (
      <DeepLinkView
        isLoading={false}
        pageNotFoundError={false}
        title={t('deepLink_RedirectingToMetaMask')}
        description={t('deepLink_ContinueDescription', [pageName])}
        extraDescription={null}
        route={{ href: 'home.html#/', signed: true }}
        cta={t('deepLink_Continue', [pageName])}
        skipDeepLinkInterstitialChecked={checked}
        onRemindMeStateChanged={() => setChecked((value) => !value)}
      />
    );
  },
};

export const Loading: Story = {
  render: () => (
    <DeepLinkView
      isLoading
      pageNotFoundError={false}
      title={null}
      description={null}
      extraDescription={null}
      route={null}
      cta={null}
      skipDeepLinkInterstitialChecked={false}
      onRemindMeStateChanged={NOOP}
    />
  ),
};

export const MissingUrl: Story = {
  name: 'Missing URL',
  parameters: {
    initialEntries: ['/'],
  },
};

export const PageNotFound: Story = {
  name: 'Page not found',
  parameters: {
    initialEntries: ['/?errorCode=404'],
  },
};

export const PageNotFoundUpdateCta: Story = {
  name: 'Page not found (update CTA)',
  render: function PageNotFoundUpdateCtaStory() {
    const t = useI18nContext() as TranslateFunction;

    return (
      <DeepLinkView
        isLoading={false}
        pageNotFoundError
        title={t('deepLink_Error404Title')}
        description={t('deepLink_Error404Description')}
        extraDescription={t('deepLink_Error404_CTA', [
          <ButtonLink
            key="update-metamask-link"
            as="a"
            href={ZENDESK_URLS.UPDATE_VERSION}
          >
            {t('deepLink_Error404_CTA_LinkText')}
          </ButtonLink>,
        ])}
        route={null}
        cta={t('deepLink_GoToTheHomePageButton')}
        skipDeepLinkInterstitialChecked={false}
        onRemindMeStateChanged={NOOP}
      />
    );
  },
};

export const GenericError: Story = {
  name: 'Generic error',
  render: function GenericErrorStory() {
    const t = useI18nContext() as TranslateFunction;

    return (
      <DeepLinkView
        isLoading={false}
        pageNotFoundError={false}
        title={t('deepLink_ErrorOtherTitle')}
        description={t('deepLink_ErrorOtherDescription')}
        extraDescription={null}
        route={null}
        cta={t('deepLink_GoToTheHomePageButton')}
        skipDeepLinkInterstitialChecked={false}
        onRemindMeStateChanged={NOOP}
      />
    );
  },
};

export const Asset: Story = createRouteStory(
  '/asset?assetId=eip155:1/slip44:60',
);
export const BatchSell: Story = createRouteStory('/batch-sell', 'Batch sell');
export const Buy: Story = createRouteStory('/buy');
export const CardOnboarding: Story = createRouteStory(
  '/card-onboarding',
  'Card onboarding',
);
export const Money: Story = createRouteStory('/money');
export const Musd: Story = createRouteStory('/earn-musd', 'MUSD');
export const Nfts: Story = createRouteStory('/nft', 'NFTs');
export const Notifications: Story = createRouteStory('/notifications');
export const Onboarding: Story = createRouteStory('/onboarding');
export const Perps: Story = createRouteStory('/perps');
export const PerpsAsset: Story = createRouteStory(
  '/perps-asset?symbol=BTC',
  'Perps asset',
);
export const PerpsMarkets: Story = createRouteStory(
  '/perps-markets',
  'Perps markets',
);
export const Predict: Story = createRouteStory('/predict');
export const Rewards: Story = createRouteStory('/rewards');
export const Sell: Story = createRouteStory('/sell');
export const Shield: Story = createRouteStory('/shield');
export const Swap: Story = createRouteStory('/swap');
export const TopTraders: Story = createRouteStory('/top-traders', 'Top traders');
export const Trending: Story = createRouteStory('/trending');
