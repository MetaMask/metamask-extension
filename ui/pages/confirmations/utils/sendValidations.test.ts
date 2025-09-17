// Unicode confusables is not typed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { confusables } from 'unicode-confusables';

import { isSolanaAddress } from '../../../../shared/lib/multichain/accounts';
import {
  findNetworkClientIdByChainId,
  getERC721AssetSymbol,
} from '../../../store/actions';
import {
  findConfusablesInRecipient,
  validateEvmHexAddress,
  validateSolanaAddress,
} from './sendValidations';

jest.mock('unicode-confusables');
jest.mock('../../../../shared/lib/multichain/accounts');
jest.mock('../../../store/actions', () => ({
  findNetworkClientIdByChainId: jest.fn(),
  getERC721AssetSymbol: jest.fn(),
}));

const mockIsSolanaAddress = jest.mocked(isSolanaAddress);
const mockGetERC721AssetSymbol = jest.mocked(getERC721AssetSymbol);
const mockFindNetworkClientIdByChainId = jest.mocked(
  findNetworkClientIdByChainId,
);

describe('SendValidations', () => {
  describe('findConfusablesInRecipient', () => {
    const mockConfusables = jest.mocked(confusables);

    beforeEach(() => {
      jest.clearAllMocks();
      mockConfusables.mockReturnValue([]);
    });

    it('returns successful validation when no confusables found', async () => {
      const result = await findConfusablesInRecipient('example.eth');

      expect(result).toEqual({});
    });

    it('returns warning when confusable characters found', async () => {
      mockConfusables.mockReturnValue([
        { point: 'а', similarTo: 'a' },
        { point: 'е', similarTo: 'e' },
      ]);

      const result = await findConfusablesInRecipient('exаmple.eth');

      expect(result).toEqual({
        confusableCharacters: [
          { point: 'а', similarTo: 'a' },
          { point: 'е', similarTo: 'e' },
        ],
        warning: 'confusingDomain',
      });
    });

    it('handles zero-width confusable characters', async () => {
      mockConfusables.mockReturnValue([
        { point: '‌', similarTo: '' },
        { point: 'a', similarTo: 'a' },
      ]);

      const result = await findConfusablesInRecipient('exa‌mple.eth');

      expect(result).toEqual({
        error: 'invalidAddress',
        warning: 'confusableZeroWidthUnicode',
      });
    });

    it('filters out duplicate confusable points', async () => {
      mockConfusables.mockReturnValue([
        { point: 'а', similarTo: 'a' },
        { point: 'а', similarTo: 'a' },
        { point: 'е', similarTo: 'e' },
      ]);

      const result = await findConfusablesInRecipient('exаmple.eth');

      expect(result.confusableCharacters).toEqual([
        { point: 'а', similarTo: 'a' },
        { point: 'е', similarTo: 'e' },
      ]);
    });

    it('filters out confusable characters with undefined similarTo', async () => {
      mockConfusables.mockReturnValue([
        { point: 'а', similarTo: 'a' },
        { point: 'х', similarTo: undefined },
        { point: 'е', similarTo: 'e' },
      ]);

      const result = await findConfusablesInRecipient('exаmple.eth');

      expect(result.confusableCharacters).toEqual([
        { point: 'а', similarTo: 'a' },
        { point: 'е', similarTo: 'e' },
      ]);
    });
  });

  describe('validateEvmHexAddress', () => {
    it('validates valid hex address successfully', async () => {
      expect(
        await validateEvmHexAddress(
          '0x1234567890123456789012345678901234567890',
        ),
      ).toEqual({});
    });

    it('rejects burn address', async () => {
      expect(
        await validateEvmHexAddress(
          '0x0000000000000000000000000000000000000000',
        ),
      ).toEqual({
        error: 'invalidAddress',
      });
    });

    it('rejects dead address', async () => {
      expect(
        await validateEvmHexAddress(
          '0x000000000000000000000000000000000000dead',
        ),
      ).toEqual({
        error: 'invalidAddress',
      });
    });

    it('rejects ERC721 token address', async () => {
      mockGetERC721AssetSymbol.mockResolvedValue('NFT' as never);
      mockFindNetworkClientIdByChainId.mockResolvedValue(
        'networkClientId' as never,
      );

      expect(
        await validateEvmHexAddress(
          '0x1234567890123456789012345678901234567890',
          '0x1',
        ),
      ).toEqual({
        error: 'invalidAddress',
      });

      expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith('0x1');
      expect(mockGetERC721AssetSymbol).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        'networkClientId',
      );
    });
  });

  describe('validateSolanaRecipient', () => {
    beforeEach(() => {
      mockIsSolanaAddress.mockReturnValue(true);
    });

    it('returns error for burn addresses', async () => {
      const burnAddress = '1nc1nerator11111111111111111111111111111111';
      expect(validateSolanaAddress(burnAddress)).toEqual({
        error: 'invalidAddress',
      });
    });

    it('returns error for another burn address', async () => {
      const burnAddress = 'So11111111111111111111111111111111111111112';
      expect(validateSolanaAddress(burnAddress)).toEqual({
        error: 'invalidAddress',
      });
    });

    it('returns success for valid Solana address', async () => {
      const validAddress = 'H8UekPGwePSmQ3ttuYGPU1sxKnk7K3SR4VBGp5dAEwQs';
      expect(validateSolanaAddress(validAddress)).toEqual({});
    });

    it('returns error for invalid Solana address', async () => {
      mockIsSolanaAddress.mockReturnValue(false);

      const invalidAddress = 'invalid-address';
      expect(validateSolanaAddress(invalidAddress)).toEqual({
        error: 'invalidAddress',
      });
    });
  });
});
