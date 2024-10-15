import React from 'react';
import { Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../store/store';
import NotificationDetails from './notification-details';
import testData from '../../../.storybook/test-data';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { Box } from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../helpers/constants/design-system';
import { NotificationsPage } from '../../components/multichain';
import { Content } from '../../components/multichain/pages/page';
import { NotificationComponents } from '../notifications/notification-components';
import { NotificationDetailsHeader } from './notification-details-header/notification-details-header';
import { NotificationDetailsBody } from './notification-details-body/notification-details-body';
import { NotificationDetailsFooter } from './notification-details-footer/notification-details-footer';

type Notification = NotificationServicesController.Types.INotification;
const { processNotification } = NotificationServicesController.Processors;

// Mock data
const {
  createMockNotificationEthSent,
  createMockNotificationEthReceived,
  createMockNotificationERC20Sent,
  createMockNotificationERC20Received,
  createMockNotificationERC721Sent,
  createMockNotificationERC721Received,
  createMockNotificationERC1155Sent,
  createMockNotificationERC1155Received,
  createMockNotificationLidoReadyToBeWithdrawn,
  createMockNotificationLidoStakeCompleted,
  createMockNotificationLidoWithdrawalCompleted,
  createMockNotificationLidoWithdrawalRequested,
  createMockNotificationMetaMaskSwapsCompleted,
  createMockNotificationRocketPoolStakeCompleted,
  createMockNotificationRocketPoolUnStakeCompleted,
  createMockFeatureAnnouncementRaw,
} = NotificationServicesController.Mocks;

const ethSentNotification: Notification = processNotification(
  createMockNotificationEthSent(),
);

const ethReceivedNotification: Notification = processNotification(
  createMockNotificationEthReceived(),
);

const erc20SentNotification: Notification = processNotification(
  createMockNotificationERC20Sent(),
);

const erc20ReceivedNotification: Notification = processNotification(
  createMockNotificationERC20Received(),
);

const erc721SentNotification: Notification = processNotification(
  createMockNotificationERC721Sent(),
);

const erc721ReceivedNotification: Notification = processNotification(
  createMockNotificationERC721Received(),
);

const erc1155SentNotification: Notification = processNotification(
  createMockNotificationERC1155Sent(),
);

const erc1155ReceivedNotification: Notification = processNotification(
  createMockNotificationERC1155Received(),
);

const store = configureStore({
  ...testData,
});

export default {
  title: 'Pages/Notifications/NotificationDetails',
  component: NotificationDetails,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
} as Meta;

const Template = ({ notification }) => {
  const ncs = NotificationComponents[notification.type];

  return (
    <Box marginLeft={'auto'} marginRight={'auto'}>
      <NotificationsPage>
        <NotificationDetailsHeader
          onClickBack={() => console.log('click back')}
        >
          <ncs.details.title notification={notification} />
        </NotificationDetailsHeader>
        <Content padding={0}>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
            width={BlockSize.Full}
            height={BlockSize.Full}
            justifyContent={JustifyContent.spaceBetween}
          >
            <NotificationDetailsBody
              body={ncs.details.body}
              notification={notification}
            />
            <NotificationDetailsFooter
              footer={ncs.footer}
              notification={notification}
            />
          </Box>
        </Content>
      </NotificationsPage>
    </Box>
  );
};

export const EthSent = Template.bind({});
EthSent.args = {
  notification: ethSentNotification,
};

export const EthReceived = Template.bind({});
EthReceived.args = {
  notification: ethReceivedNotification,
};

export const ERC20Sent = Template.bind({});
ERC20Sent.args = {
  notification: erc20SentNotification,
};

export const ERC20Received = Template.bind({});
ERC20Received.args = {
  notification: erc20ReceivedNotification,
};

export const ERC721Sent = Template.bind({});
ERC721Sent.args = {
  notification: erc721SentNotification,
};

export const ERC721Received = Template.bind({});
ERC721Received.args = {
  notification: erc721ReceivedNotification,
};

export const ERC1155Sent = Template.bind({});
ERC1155Sent.args = {
  notification: erc1155SentNotification,
};

export const ERC1155Received = Template.bind({});
ERC1155Received.args = {
  notification: erc1155ReceivedNotification,
};
