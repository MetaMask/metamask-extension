import React from 'react';
import SignatureRequestSIWEIcon from '.';

export default {
  title: 'Components/App/SignatureRequestSIWE/SignatureRequestSIWEIcon',
  id: __filename,
  argTypes: {
    domain: { control: 'text' },
  },
};

export const DefaultStory = (args) => <SignatureRequestSIWEIcon {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  domain: window.location.host,
};
