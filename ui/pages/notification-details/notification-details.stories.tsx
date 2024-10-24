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

// Mock data
const mockNotifications = {
  ethSent: createMockNotificationEthSent,
  ethReceived: createMockNotificationEthReceived,
  erc20Sent: createMockNotificationERC20Sent,
  erc20Received: createMockNotificationERC20Received,
  erc721Sent: createMockNotificationERC721Sent,
  erc721Received: createMockNotificationERC721Received,
  erc1155Sent: createMockNotificationERC1155Sent,
  erc1155Received: createMockNotificationERC1155Received,
  lidoReadyToBeWithdrawn: createMockNotificationLidoReadyToBeWithdrawn,
  lidoStakeCompleted: createMockNotificationLidoStakeCompleted,
  lidoWithdrawalCompleted: createMockNotificationLidoWithdrawalCompleted,
  lidoWithdrawalRequested: createMockNotificationLidoWithdrawalRequested,
  metaMaskSwapsCompleted: createMockNotificationMetaMaskSwapsCompleted,
  rocketPoolStakeCompleted: createMockNotificationRocketPoolStakeCompleted,
  rocketPoolUnStakeCompleted: createMockNotificationRocketPoolUnStakeCompleted,
  featureAnnouncement: createMockFeatureAnnouncementRaw,
};

const processedNotifications = Object.fromEntries(
  Object.entries(mockNotifications).map(([key, createMock]) => [
    key,
    processNotification(createMock()),
  ]),
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
  notification: processedNotifications.ethSent,
};

export const EthReceived = Template.bind({});
EthReceived.args = {
  notification: processedNotifications.ethReceived,
};

export const ERC20Sent = Template.bind({});
ERC20Sent.args = {
  notification: processedNotifications.erc20Sent,
};

export const ERC20Received = Template.bind({});
ERC20Received.args = {
  notification: processedNotifications.erc20Received,
};

export const ERC721Sent = Template.bind({});
ERC721Sent.args = {
  notification: processedNotifications.erc721Sent,
};

export const ERC721Received = Template.bind({});
ERC721Received.args = {
  notification: processedNotifications.erc721Received,
};

export const ERC1155Sent = Template.bind({});
ERC1155Sent.args = {
  notification: processedNotifications.erc1155Sent,
};

export const ERC1155Received = Template.bind({});
ERC1155Received.args = {
  notification: processedNotifications.erc1155Received,
};

export const LidoReadyToBeWithdrawn = Template.bind({});
LidoReadyToBeWithdrawn.args = {
  notification: processedNotifications.lidoReadyToBeWithdrawn,
};

export const lidoStakeCompleted = Template.bind({});
lidoStakeCompleted.args = {
  notification: processedNotifications.lidoStakeCompleted,
};

export const lidoWithdrawalCompleted = Template.bind({});
lidoWithdrawalCompleted.args = {
  notification: processedNotifications.lidoWithdrawalCompleted,
};

export const lidoWithdrawalRequested = Template.bind({});
lidoWithdrawalRequested.args = {
  notification: processedNotifications.lidoWithdrawalRequested,
};

export const metaMaskSwapsCompleted = Template.bind({});
metaMaskSwapsCompleted.args = {
  notification: processedNotifications.metaMaskSwapsCompleted,
};

export const rocketPoolStakeCompleted = Template.bind({});
rocketPoolStakeCompleted.args = {
  notification: processedNotifications.rocketPoolStakeCompleted,
};

export const rocketPoolUnStakeCompleted = Template.bind({});
rocketPoolUnStakeCompleted.args = {
  notification: processedNotifications.rocketPoolUnStakeCompleted,
};

export const featureAnnouncement = Template.bind({});
featureAnnouncement.args = {
  notification: processedNotifications.featureAnnouncement,
};
