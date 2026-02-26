import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import { HandlerType } from '@metamask/snaps-utils';
import { SOLANA_WALLET_SNAP_ID } from '../../../../../shared/lib/accounts';
import {
  signSolanaRewardsMessage,
  SignRewardsMessageResult,
} from './solana-snap';

// Mock the snap request handler
const mockHandleSnapRequest = jest.fn() as jest.MockedFunction<
  HandleSnapRequest['handler']
>;

// Mock console.error to avoid test noise
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('solana-snap', () => {
  const mockAccountId = '550e8400-e29b-41d4-a716-446655440000';
  const mockMessage = 'Test message for signing';
  const mockSignatureResult: SignRewardsMessageResult = {
    signature: 'mockSignature123',
    signedMessage: 'mockSignedMessage',
    signatureType: 'ed25519',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleSnapRequest.mockClear();
    // Clear console.error mock calls
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('signSolanaRewardsMessage', () => {
    it('successfully signs a Solana rewards message', async () => {
      // Arrange
      mockHandleSnapRequest.mockResolvedValueOnce(mockSignatureResult);

      // Act
      const result = await signSolanaRewardsMessage(
        mockHandleSnapRequest,
        mockAccountId,
        mockMessage,
      );

      // Assert
      expect(result).toEqual(mockSignatureResult);
      expect(mockHandleSnapRequest).toHaveBeenCalledTimes(1);
      expect(mockHandleSnapRequest).toHaveBeenCalledWith({
        origin: 'metamask',
        snapId: SOLANA_WALLET_SNAP_ID,
        handler: HandlerType.OnClientRequest,
        request: {
          jsonrpc: '2.0',
          id: expect.any(Number),
          method: 'signRewardsMessage',
          params: {
            accountId: mockAccountId,
            message: mockMessage,
          },
        },
      });
    });

    it('passes correct parameters to handleSnapRequest', async () => {
      // Arrange
      const expectedTimestamp = Date.now();
      jest.spyOn(Date, 'now').mockReturnValueOnce(expectedTimestamp);
      mockHandleSnapRequest.mockResolvedValueOnce(mockSignatureResult);

      // Act
      await signSolanaRewardsMessage(
        mockHandleSnapRequest,
        mockAccountId,
        mockMessage,
      );

      // Assert
      expect(mockHandleSnapRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: 'metamask',
          snapId: SOLANA_WALLET_SNAP_ID,
          handler: HandlerType.OnClientRequest,
          request: expect.objectContaining({
            jsonrpc: '2.0',
            id: expectedTimestamp,
            method: 'signRewardsMessage',
            params: {
              accountId: mockAccountId,
              message: mockMessage,
            },
          }),
        }),
      );
    });

    it('handles network timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Network timeout');
      mockHandleSnapRequest.mockRejectedValueOnce(timeoutError);

      // Act & Assert
      await expect(
        signSolanaRewardsMessage(
          mockHandleSnapRequest,
          mockAccountId,
          mockMessage,
        ),
      ).rejects.toThrow('Network timeout');
    });

    it('handles snap not available error', async () => {
      // Arrange
      const snapError = new Error('Snap not found');
      mockHandleSnapRequest.mockRejectedValueOnce(snapError);

      // Act & Assert
      await expect(
        signSolanaRewardsMessage(
          mockHandleSnapRequest,
          mockAccountId,
          mockMessage,
        ),
      ).rejects.toThrow('Snap not found');
    });

    it('generates unique request IDs for concurrent calls', async () => {
      // Arrange
      const firstTimestamp = 1000;
      const secondTimestamp = 2000;
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(firstTimestamp)
        .mockReturnValueOnce(secondTimestamp);

      mockHandleSnapRequest
        .mockResolvedValueOnce(mockSignatureResult)
        .mockResolvedValueOnce(mockSignatureResult);

      // Act
      const [result1, result2] = await Promise.all([
        signSolanaRewardsMessage(
          mockHandleSnapRequest,
          mockAccountId,
          mockMessage,
        ),
        signSolanaRewardsMessage(
          mockHandleSnapRequest,
          mockAccountId,
          'Different message',
        ),
      ]);

      // Assert
      expect(result1).toEqual(mockSignatureResult);
      expect(result2).toEqual(mockSignatureResult);
      expect(mockHandleSnapRequest).toHaveBeenCalledTimes(2);

      // Verify different request IDs were used
      const firstCall = mockHandleSnapRequest.mock.calls[0];
      const secondCall = mockHandleSnapRequest.mock.calls[1];
      expect(firstCall[0].request.id).toBe(firstTimestamp);
      expect(secondCall[0].request.id).toBe(secondTimestamp);
    });

    it('handles empty accountId parameter', async () => {
      // Arrange
      mockHandleSnapRequest.mockResolvedValueOnce(mockSignatureResult);

      // Act
      const result = await signSolanaRewardsMessage(
        mockHandleSnapRequest,
        '',
        mockMessage,
      );

      // Assert
      expect(result).toEqual(mockSignatureResult);
      expect(mockHandleSnapRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            params: {
              accountId: '',
              message: mockMessage,
            },
          }),
        }),
      );
    });

    it('handles empty message parameter', async () => {
      // Arrange
      mockHandleSnapRequest.mockResolvedValueOnce(mockSignatureResult);

      // Act
      const result = await signSolanaRewardsMessage(
        mockHandleSnapRequest,
        mockAccountId,
        '',
      );

      // Assert
      expect(result).toEqual(mockSignatureResult);
      expect(mockHandleSnapRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            params: {
              accountId: mockAccountId,
              message: '',
            },
          }),
        }),
      );
    });
  });
});
