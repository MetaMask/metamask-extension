import React from 'react';
import InfoTooltip from '../../../../components/ui/info-tooltip/info-tooltip';
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import GasTiming from '../gas-timing/gas-timing.component';
import { Icon, IconName } from '../../../../components/component-library';
import README from './README.mdx';
import TransactionDetail from '.';

export default {
  title: 'Confirmations/Components/TransactionDetail',

  component: TransactionDetail,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    rows: { control: 'array' },
    onEdit: { action: 'onEdit' },
  },
};

const rows = [
  <TransactionDetailItem
    key="line-1"
    detailTitle={
      <>
        Estimated gas fee
        <InfoTooltip contentText="This is the tooltip text" position="top">
          <Icon name={IconName.Info} />
        </InfoTooltip>
      </>
    }
    detailText="0.00896 ETH"
    detailTotal="$15.73"
    subTitle={<GasTiming maxPriorityFeePerGas="1" />}
    subText={
      <>
        From <strong>$15.73 - $19.81</strong>
      </>
    }
  />,
  <TransactionDetailItem
    key="line-2"
    detailTitle="Total"
    detailText=".0312 ETH"
    detailTotal="$15.77"
    subTitle="Amount + gas fee"
    subText={
      <>
        Up to <strong>$19.85</strong>
      </>
    }
  />,
];

export const DefaultStory = (args) => {
  return <TransactionDetail {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  rows,
};
