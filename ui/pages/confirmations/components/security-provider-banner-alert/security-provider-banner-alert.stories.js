import React from 'react';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../../components/component-library';
import { SecurityProvider } from '../../../../../shared/constants/security-provider';
import SecurityProviderBannerAlert from './security-provider-banner-alert';

const mockPlainText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sapien tellus, elementum sit ' +
  'amet laoreet vitae, semper in est. Nulla vel tristique felis. Donec non tellus eget neque cursus malesuada.';

const MockDescriptionWithLinks = () => (
  <>
    Description shouldn’t repeat title. 1-3 lines. Can contain a{' '}
    <ButtonLink size={ButtonLinkSize.Inherit}>hyperlink</ButtonLink>. It can
    also contain a toggle to enable progressive disclosure.
  </>
);

const MockDetailsList = () => (
  <Text as="ul">
    <li>• List item</li>
    <li>• List item</li>
    <li>• List item</li>
    <li>• List item</li>
  </Text>
);

export default {
  title: 'Confirmations/Components/SecurityProviderBannerAlert',
  argTypes: {
    description: {
      control: {
        type: 'select',
      },
      options: ['plainText', 'withLinks'],
      mapping: {
        plainText: mockPlainText,
        withLinks: <MockDescriptionWithLinks />,
      },
    },
    details: {
      control: {
        type: 'select',
      },
      options: ['none', 'plainText', 'withList'],
      mapping: {
        none: null,
        plainText: mockPlainText,
        withList: <MockDetailsList />,
      },
    },
    provider: {
      control: {
        type: 'select',
      },
      options: ['none', ...Object.values(SecurityProvider)],
      mapping: {
        none: null,
      },
    },
    severity: {
      control: {
        type: 'select',
      },
      options: [Severity.Danger, Severity.Warning],
    },
    title: {
      control: 'text',
    },
  },
  args: {
    title: 'Title is sentence case no period',
    description: <MockDescriptionWithLinks />,
    details: <MockDetailsList />,
    provider: SecurityProvider.Blockaid,
  },
};

export const DefaultStory = (args) => (
  <SecurityProviderBannerAlert severity={Severity.Warning} {...args} />
);
DefaultStory.storyName = 'Default';

export const Danger = (args) => (
  <SecurityProviderBannerAlert severity={Severity.Danger} {...args} />
);

export const Warning = (args) => (
  <SecurityProviderBannerAlert severity={Severity.Warning} {...args} />
);
