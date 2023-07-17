import React from 'react';
import BlockaidBannerAlert from '.';

const mockPpomResponse = {
  resultType: 'Warning',
  reason: 'set_approval_for_all',
  description:
    'A SetApprovalForAll request was made on {contract}. We found the operator {operator} to be malicious',
  args: {
    contract: '0xa7206d878c5c3871826dfdb42191c49b1d11f466',
    operator: '0x92a3b9773b1763efa556f55ccbeb20441962d9b2',
  },
  features: [
    'Operator is an EOA',
    'Operator is untrusted according to previous activity',
  ],
};

export default {
  title: 'Components/App/SecurityProviderBannerAlert/Blockaid',
  argTypes: {
    ppomResponse: {
      control: 'object',
    },
  },
  args: {
    ppomResponse: mockPpomResponse,
  },
};

export const DefaultStory = (args) => <BlockaidBannerAlert {...args} />;
DefaultStory.storyName = 'Default';
