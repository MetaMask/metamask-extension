import React from 'react';
import NftDefaultImage from '.';

export default {
  title: 'Components/App/NftDefaultImage',

  argTypes: {
    clickable: {
      control: 'boolean',
    },
  },
};

const Template = (args) => (
  <div style={{ width: 200, height: 200 }}>
    <NftDefaultImage {...args} />
  </div>
);

export const DefaultStory = Template.bind({});

export const WithShowButton = Template.bind({});
WithShowButton.args = {
  clickable: true,
};
