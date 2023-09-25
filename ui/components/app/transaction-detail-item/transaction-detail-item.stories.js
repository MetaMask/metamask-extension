import React from 'react';
import InfoTooltip from '../../ui/info-tooltip/info-tooltip';

import { TextColor } from '../../../helpers/constants/design-system';

import { Icon, IconName } from '../../component-library';
import README from './README.mdx';
import TransactionDetailItem from '.';

export default {
  title: 'Components/App/TransactionDetailItem',
  component: TransactionDetailItem,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    detailTitle: { control: 'object' },
    detailTitleColor: {
      control: {
        type: 'select',
      },
      options: Object.values(TextColor),
    },
    detailText: { control: 'text' },
    detailTotal: { control: 'text' },
    subTitle: { control: 'object' },
    subText: { control: 'object' },
  },
};

export const DefaultStory = (args) => {
  return (
    <div style={{ width: '400px' }}>
      <TransactionDetailItem {...args} />
    </div>
  );
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  detailTitle: (
    <>
      <strong>Estimated gas fee</strong>
      <InfoTooltip contentText="This is the tooltip text" position="top">
        <Icon name={IconName.Info} />
      </InfoTooltip>
    </>
  ),
  detailText: '16565.30',
  detailTotal: '0.0089 ETH',
  subTitle: 'Likely in < 30 seconds',
  boldHeadings: true,
  flexWidthValues: false,
  subText: (
    <span>
      From <strong>$16565 - $19000</strong>
    </span>
  ),
};
