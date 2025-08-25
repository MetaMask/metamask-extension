import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../store/store';
import NotificationDetails from './notification-details';
import testData from '../../../.storybook/test-data';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { Box } from '../../components/component-library';
import {
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
} from '@metamask/notification-services-controller/notification-services/mocks';
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
const store = configureStore({
  ...testData,
});

export default {
  title: 'Pages/NotificationDetails',
  component: NotificationDetails,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
} as Meta<typeof NotificationDetails>;

const notificationMocks = {
  EthSent: createMockNotificationEthSent,
  EthReceived: createMockNotificationEthReceived,
  ERC20Sent: createMockNotificationERC20Sent,
  ERC20Received: createMockNotificationERC20Received,
  ERC721Sent: createMockNotificationERC721Sent,
  ERC721Received: createMockNotificationERC721Received,
  ERC1155Sent: createMockNotificationERC1155Sent,
  ERC1155Received: createMockNotificationERC1155Received,
  LidoReadyToBeWithdrawn: createMockNotificationLidoReadyToBeWithdrawn,
  LidoStakeCompleted: createMockNotificationLidoStakeCompleted,
  LidoWithdrawalCompleted: createMockNotificationLidoWithdrawalCompleted,
  LidoWithdrawalRequested: createMockNotificationLidoWithdrawalRequested,
  MetaMaskSwapsCompleted: createMockNotificationMetaMaskSwapsCompleted,
  RocketPoolStakeCompleted: createMockNotificationRocketPoolStakeCompleted,
  RocketPoolUnStakeCompleted: createMockNotificationRocketPoolUnStakeCompleted,
  FeatureAnnouncement: createMockFeatureAnnouncementRaw,
} as const;

const Template = ({ notification }: { notification: Notification }) => {
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

const stories = {} as {
  [key in keyof typeof notificationMocks]: StoryFn<typeof NotificationDetails>;
};

Object.entries(notificationMocks).forEach(([storyName, createMock]) => {
  stories[storyName] = Template.bind({});
  stories[storyName].args = { notification: processNotification(createMock()) };
});

export const EthSent = stories.EthSent;
export const EthReceived = stories.EthReceived;
export const ERC20Sent = stories.ERC20Sent;
export const ERC20Received = stories.ERC20Received;
export const ERC721Sent = stories.ERC721Sent;
export const ERC721Received = stories.ERC721Received;
export const ERC1155Sent = stories.ERC1155Sent;
export const ERC1155Received = stories.ERC1155Received;
export const LidoReadyToBeWithdrawn = stories.LidoReadyToBeWithdrawn;
export const LidoStakeCompleted = stories.LidoStakeCompleted;
export const LidoWithdrawalCompleted = stories.LidoWithdrawalCompleted;
export const LidoWithdrawalRequested = stories.LidoWithdrawalRequested;
export const MetaMaskSwapsCompleted = stories.MetaMaskSwapsCompleted;
export const RocketPoolStakeCompleted = stories.RocketPoolStakeCompleted;
export const RocketPoolUnStakeCompleted = stories.RocketPoolUnStakeCompleted;
export const FeatureAnnouncement = stories.FeatureAnnouncement;
