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
        'securityAlertResponse.features value which is a list displayed as SecurityProviderBannerAlert details',
    },
    reason: {
      control: 'select',
      options: Object.values(BlockaidReason),
      description: 'securityAlertResponse.reason value',
    },
    result_type: {
      control: 'select',
      options: Object.values(BlockaidResultType),
      description: 'securityAlertResponse.result_type value',
    },
  },
  args: {
    features: mockFeatures,
    reason: BlockaidReason.setApprovalForAll,
    result_type: BlockaidResultType.Warning,
  },
};

export const DefaultStory = (args) => (
  <BlockaidBannerAlert securityAlertResponse={args} />
);
DefaultStory.storyName = 'Default';
