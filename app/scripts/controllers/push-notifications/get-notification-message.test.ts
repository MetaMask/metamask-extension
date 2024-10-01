import { NotificationServicesController } from '@metamask/notification-services-controller';
import { createNotificationMessage } from './get-notification-message';

const {
  createMockNotificationERC1155Received,
  createMockNotificationERC1155Sent,
  createMockNotificationERC20Received,
  createMockNotificationERC20Sent,
  createMockNotificationERC721Received,
  createMockNotificationERC721Sent,
  createMockNotificationEthReceived,
  createMockNotificationEthSent,
  createMockNotificationLidoReadyToBeWithdrawn,
  createMockNotificationLidoStakeCompleted,
  createMockNotificationLidoWithdrawalCompleted,
  createMockNotificationLidoWithdrawalRequested,
  createMockNotificationMetaMaskSwapsCompleted,
  createMockNotificationRocketPoolStakeCompleted,
  createMockNotificationRocketPoolUnStakeCompleted,
} = NotificationServicesController.Mocks;

const { processNotification } = NotificationServicesController.Processors;

describe('notification-message tests', () => {
  it('displays erc20 sent notification', () => {
    const notification = processNotification(createMockNotificationERC20Sent());
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Funds sent');
    expect(result?.description).toContain('You successfully sent 4.96K USDC');
  });

  it('displays erc20 received notification', () => {
    const notification = processNotification(
      createMockNotificationERC20Received(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Funds received');
    expect(result?.description).toContain('You received 8.38B SHIB');
  });

  it('displays eth/native sent notification', () => {
    const notification = processNotification(createMockNotificationEthSent());
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Funds sent');
    expect(result?.description).toContain('You successfully sent 0.005 ETH');
  });

  it('displays eth/native received notification', () => {
    const notification = processNotification(
      createMockNotificationEthReceived(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Funds received');
    expect(result?.description).toContain('You received 808 ETH');
  });

  it('displays metamask swap completed notification', () => {
    const notification = processNotification(
      createMockNotificationMetaMaskSwapsCompleted(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Swap completed');
    expect(result?.description).toContain('Your MetaMask Swap was successful');
  });

  it('displays erc721 sent notification', () => {
    const notification = processNotification(
      createMockNotificationERC721Sent(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('NFT sent');
    expect(result?.description).toContain('You have successfully sent an NFT');
  });

  it('displays erc721 received notification', () => {
    const notification = processNotification(
      createMockNotificationERC721Received(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('NFT received');
    expect(result?.description).toContain('You received new NFTs');
  });

  it('displays erc1155 sent notification', () => {
    const notification = processNotification(
      createMockNotificationERC1155Sent(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('NFT sent');
    expect(result?.description).toContain('You have successfully sent an NFT');
  });

  it('displays erc1155 received notification', () => {
    const notification = processNotification(
      createMockNotificationERC1155Received(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('NFT received');
    expect(result?.description).toContain('You received new NFTs');
  });

  it('displays rocketpool stake completed notification', () => {
    const notification = processNotification(
      createMockNotificationRocketPoolStakeCompleted(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Stake complete');
    expect(result?.description).toContain(
      'Your RocketPool stake was successful',
    );
  });

  it('displays rocketpool unstake completed notification', () => {
    const notification = processNotification(
      createMockNotificationRocketPoolUnStakeCompleted(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Unstake complete');
    expect(result?.description).toContain(
      'Your RocketPool unstake was successful',
    );
  });

  it('displays lido stake completed notification', () => {
    const notification = processNotification(
      createMockNotificationLidoStakeCompleted(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Stake complete');
    expect(result?.description).toContain('Your Lido stake was successful');
  });

  it('displays lido stake ready to be withdrawn notification', () => {
    const notification = processNotification(
      createMockNotificationLidoReadyToBeWithdrawn(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Stake ready for withdrawal');
    expect(result?.description).toContain(
      'Your Lido stake is now ready to be withdrawn',
    );
  });

  it('displays lido withdrawal requested notification', () => {
    const notification = processNotification(
      createMockNotificationLidoWithdrawalRequested(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Withdrawal requested');
    expect(result?.description).toContain(
      'Your Lido withdrawal request was submitted',
    );
  });

  it('displays lido withdrawal completed notification', () => {
    const notification = processNotification(
      createMockNotificationLidoWithdrawalCompleted(),
    );
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Withdrawal completed');
    expect(result?.description).toContain(
      'Your Lido withdrawal was successful',
    );
  });
});
