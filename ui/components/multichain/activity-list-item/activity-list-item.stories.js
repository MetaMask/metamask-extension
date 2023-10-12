import React from 'react';
import TransactionStatusLabel from '../../app/transaction-status-label';
import TransactionIcon from '../../app/transaction-icon';
import CancelButton from '../../app/cancel-button';
import {
  BackgroundColor,
  Color,
  Display,
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  BadgeWrapperAnchorElementShape,
  Box,
  Text,
} from '../../component-library';
import { ActivityListItem } from './activity-list-item';

export default {
  title: 'Components/Multichain/ActivityListItem',
  component: ActivityListItem,
};

const Template = (args) => <ActivityListItem {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.args = {
  'data-testid': 'activity-list-item',
  onClick: () => undefined,
  className: 'custom-class',
  title: 'Activity Title',
  icon: (
    <BadgeWrapper
      anchorElementShape={BadgeWrapperAnchorElementShape.circular}
      positionObj={{ top: -4, right: -4 }}
      display={Display.Block}
      badge={
        <AvatarNetwork
          className="activity-tx__network-badge"
          data-testid="activity-tx-network-badge"
          size={AvatarNetworkSize.Xs}
          name="Network Name"
          src="./images/eth_logo.png"
          borderWidth={1}
          borderColor={BackgroundColor.backgroundDefault}
        />
      }
    >
      <TransactionIcon category="interaction" status="failed" />
    </BadgeWrapper>
  ),
  subtitle: (
    <TransactionStatusLabel
      statusOnly
      isPending
      isEarliestNonce
      error={{}}
      date={new Date().toDateString()}
      status="pending"
    />
  ),
  rightContent: (
    <>
      <Text
        variant={TextVariant.bodyLgMedium}
        fontWeight={FontWeight.Medium}
        color={Color.textDefault}
        title="Primary Currency"
        textAlign={TextAlign.Right}
        data-testid="transaction-list-item-primary-currency"
        className="activity-list-item__primary-currency"
        ellipsis
      >
        Primary Currency
      </Text>
      <Text
        variant={TextVariant.bodyMd}
        color={Color.textAlternative}
        textAlign={TextAlign.Right}
        data-testid="transaction-list-item-secondary-currency"
      >
        Secondary Currency
      </Text>
    </>
  ),
  children: (
    <Box paddingTop={4} className="transaction-list-item__pending-actions">
      <CancelButton
        transaction={{}}
        cancelTransaction={() => {
          console.log('canceled');
        }}
      />
    </Box>
  ),
};
