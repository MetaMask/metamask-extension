import React from 'react';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../component-library';
import { SecurityProvider } from '../../../../../shared/constants/security-provider';
import GeneralAlert from './general-alert';

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
  title: 'Components/App/AlertSystem/GeneralAlert',
  component: GeneralAlert,
  argTypes: {
    description: {
      control: 'text',
      defaultValue: mockPlainText,
    },
    details: {
      control: {
        type: 'select',
      },
      options: ['none', 'withList'],
      mapping: {
        none: null,
        withList: <MockDetailsList />,
      },
    },
    onClickSupportLink: { action: 'onClickSupportLink' },
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
      options: [Severity.Danger, Severity.Info, Severity.Warning],
    },
    title: {
      control: 'text',
      defaultValue: 'Title is sentence case no period',
    },
    reportUrl: {
      control: 'text',
    },
  },
};

export const Default = (args) => <GeneralAlert {...args} />;
Default.args = {
  description: 'This is a default security alert banner.',
  severity: Severity.Warning,
  title: 'Components/App/AlertSystem/GeneralAlert',
  provider: SecurityProvider.Blockaid,
};

export const WithDetailsList = (args) => <GeneralAlert {...args} />;
WithDetailsList.args = {
  ...Default.args,
  details: <MockDetailsList />,
};

export const WithLinksInDescription = (args) => <GeneralAlert {...args} />;
WithLinksInDescription.args = {
  ...Default.args,
  description: <MockDescriptionWithLinks />,
};
