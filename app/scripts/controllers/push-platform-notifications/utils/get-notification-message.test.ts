import {
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
} from '../../metamask-notifications/mocks/mock-raw-notifications';
import { createNotificationMessage } from './get-notification-message';

describe('notification-message tests', () => {
  test('displays erc20 sent notification', () => {
    const notification = createMockNotificationERC20Sent();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Funds sent');
    expect(result?.description).toContain('You successfully sent 4.96K USDC');
  });

  test('displays erc20 received notification', () => {
    const notification = createMockNotificationERC20Received();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Funds received');
    expect(result?.description).toContain('You received 8.38B SHIB');
  });

  test('displays eth/native sent notification', () => {
    const notification = createMockNotificationEthSent();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Funds sent');
    expect(result?.description).toContain('You successfully sent 0.005 ETH');
  });

  test('displays eth/native received notification', () => {
    const notification = createMockNotificationEthReceived();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Funds received');
    expect(result?.description).toContain('You received 808 ETH');
  });

  test('displays metamask swap completed notification', () => {
    const notification = createMockNotificationMetaMaskSwapsCompleted();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Swap completed');
    expect(result?.description).toContain('Your MetaMask Swap was successful');
  });

  test('displays erc721 sent notification', () => {
    const notification = createMockNotificationERC721Sent();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('NFT sent');
    expect(result?.description).toContain('You have successfully sent an NFT');
  });

  test('displays erc721 received notification', () => {
    const notification = createMockNotificationERC721Received();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('NFT received');
    expect(result?.description).toContain('You received new NFTs');
  });

  test('displays erc1155 sent notification', () => {
    const notification = createMockNotificationERC1155Sent();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('NFT sent');
    expect(result?.description).toContain('You have successfully sent an NFT');
  });

  test('displays erc1155 received notification', () => {
    const notification = createMockNotificationERC1155Received();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('NFT received');
    expect(result?.description).toContain('You received new NFTs');
  });

  test('displays rocketpool stake completed notification', () => {
    const notification = createMockNotificationRocketPoolStakeCompleted();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Stake complete');
    expect(result?.description).toContain(
      'Your RocketPool stake was successful',
    );
  });

  test('displays rocketpool unstake completed notification', () => {
    const notification = createMockNotificationRocketPoolUnStakeCompleted();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Unstake complete');
    expect(result?.description).toContain(
      'Your RocketPool unstake was successful',
    );
  });

  test('displays lido stake completed notification', () => {
    const notification = createMockNotificationLidoStakeCompleted();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Stake complete');
    expect(result?.description).toContain('Your Lido stake was successful');
  });

  test('displays lido stake ready to be withdrawn notification', () => {
    const notification = createMockNotificationLidoReadyToBeWithdrawn();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Stake ready for withdrawal');
    expect(result?.description).toContain(
      'Your Lido stake is now ready to be withdrawn',
    );
  });

  test('displays lido withdrawal requested notification', () => {
    const notification = createMockNotificationLidoWithdrawalRequested();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Withdrawal requested');
    expect(result?.description).toContain(
      'Your Lido withdrawal request was submitted',
    );
  });

  test('displays lido withdrawal completed notification', () => {
    const notification = createMockNotificationLidoWithdrawalCompleted();
    const result = createNotificationMessage(notification);

    expect(result?.title).toBe('Withdrawal completed');
    expect(result?.description).toContain(
      'Your Lido withdrawal was successful',
    );
  });
});
