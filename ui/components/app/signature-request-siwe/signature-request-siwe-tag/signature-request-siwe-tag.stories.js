import React from 'react';
import SignatureRequestSIWETag from '.';

export default {
  title: 'Components/App/SignatureRequestSIWE/SignatureRequestSIWETag',
  id: __filename,
  argTypes: {
    domain: { control: 'text' },
  },
};

export const DefaultStory = (args) => <SignatureRequestSIWETag {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  domain: window.location.host,
};
