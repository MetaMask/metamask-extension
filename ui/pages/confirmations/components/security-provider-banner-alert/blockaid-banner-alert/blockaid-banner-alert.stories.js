import React from 'react';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../../../shared/constants/security-provider';
import BlockaidBannerAlert from '.';

const mockFeatures = [
  'Operator is an EOA',
  'Operator is untrusted according to previous activity',
];

export default {
  title:
    'Confirmations/Components/SecurityProviderBannerAlert/BlockaidBannerAlert',
  argTypes: {
    reason: {
      control: 'select',
      options: Object.values(BlockaidReason).filter(
        (reason) => reason !== BlockaidReason.notApplicable,
      ),
      description:
        '(non-param) overrides txData.securityAlertResponse.reason value',
    },
    resultType: {
      control: 'select',
      options: Object.values(BlockaidResultType).filter(
        (result) => result !== BlockaidResultType.NotApplicable,
      ),
      description:
        '(non-param) overrides securityAlertResponse.resultType value',
    },
    txData: {
      control: 'object',
    },
  },
  args: {
    txData: {
      securityAlertResponse: {
        features: mockFeatures,
        reason: BlockaidReason.setApprovalForAll,
        result_type: BlockaidResultType.Warning,
      },
    },
  },
};

export const DefaultStory = (args) => {
  const { reason, resultType, txData } = args;

  if (reason) {
    txData.securityAlertResponse.reason = reason;
  }
  if (resultType) {
    txData.securityAlertResponse.result_type = resultType;
  }

  return <BlockaidBannerAlert txData={args.txData} />;
};
DefaultStory.storyName = 'Default';
