import React from 'react';
import { ConfirmInfoRow } from './row';
import { ConfirmInfoRowUrl } from './url';

const ConfirmInfoRowUrlStory = {
  title: 'Components/App/Confirm/InfoRowUrl',
  component: ConfirmInfoRowUrl,

  decorators: [
    (story) => <ConfirmInfoRow label="Url">{story()}</ConfirmInfoRow>,
  ],

  argTypes: {
    url: {
      control: 'text',
    },
  },
};

export const DefaultStory = ({ url }) => <ConfirmInfoRowUrl url={url} />;
DefaultStory.args = {
  url: 'https://example.com',
};

export const HttpStory = ({ url }) => <ConfirmInfoRowUrl url={url} />;
HttpStory.args = {
  url: 'http://example.com',
};

export default ConfirmInfoRowUrlStory;
