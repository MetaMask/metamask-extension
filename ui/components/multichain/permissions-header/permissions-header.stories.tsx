import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { PermissionsHeader } from './permissions-header';

const meta = {
  title: 'Components/Multichain/Pages/PermissionsHeader',
  component: PermissionsHeader,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PermissionsHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    securedOrigin: 'https://github.io',
    connectedSubjectsMetadata: {
      name: 'GitHub Pages',
      iconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
    },
  },
};

export const WithoutIcon: Story = {
  args: {
    securedOrigin: 'https://example.com',
  },
};

export const LongDomainName: Story = {
  args: {
    securedOrigin: 'https://very-very-very-very-very-very-very-very-very-very-long-domain-name-that-should-be-truncated.com',
    connectedSubjectsMetadata: {
      name: 'Very Very Very Very Very Very Very Long Domain Name',
      iconUrl: 'https://example.com/favicon.ico',
    },
  },
};
