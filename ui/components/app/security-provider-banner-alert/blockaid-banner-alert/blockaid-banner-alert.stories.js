import React from 'react';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../../shared/constants/security-provider';
import BlockaidBannerAlert from '.';

const mockFeatures = [
  'Operator is an EOA',
  'Operator is untrusted according to previous activity',
];

export default {
  title: 'Components/App/SecurityProviderBannerAlert/BlockaidBannerAlert',
  argTypes: {
    features: {
      control: 'array',
      description:
        'ppomResponse.features value which is a list displayed as SecurityProviderBannerAlert details',
    },
    reason: {
      control: 'select',
      options: Object.values(BlockaidReason),
      description: 'ppomResponse.reason value',
    },
    resultType: {
      control: 'select',
      options: Object.values(BlockaidResultType),
      description: 'ppomResponse.resultType value',
    },
  },
  args: {
    features: mockFeatures,
    reason: BlockaidReason.setApprovalForAll,
    resultType: BlockaidResultType.Warning,
  },
};

export const DefaultStory = (args) => (
  <BlockaidBannerAlert ppomResponse={args} />
);
DefaultStory.storyName = 'Default';
