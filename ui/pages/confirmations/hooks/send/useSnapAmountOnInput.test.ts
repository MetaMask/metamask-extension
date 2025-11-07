import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetType } from '@metamask/utils';

import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import * as SendContext from '../../context/send';
import * as MultichainSnaps from '../../utils/multichain-snaps';
import { useSnapAmountOnInput } from './useSnapAmountOnInput';

const MOCK_ACCOUNT: InternalAccount = {
  id: '80c14733-13cc-4966-bf1a-6212a6409c22',
  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  type: 'eip155:eoa',
  options: {},
  methods: [],
  metadata: {
    name: 'Test Account',
    keyring: { type: 'HD Key Tree' },
    snap: { id: 'npm:@metamask/test-snap', enabled: true },
  },
  scopes: [],
} as unknown as InternalAccount;

const MOCK_ASSET = {
  assetId: 'eip155:11155111/slip44:60' as CaipAssetType,
  address: '0x0000000000000000000000000000000000000000',
  chainId: 5,
  decimals: 18,
  name: 'Ether',
  symbol: 'ETH',
  isNative: true,
};

describe('useSnapAmountOnInput', () => {
  let validateAmountMultichainMock: jest.SpyInstance;

  beforeEach(() => {
    validateAmountMultichainMock = jest
      .spyOn(MultichainSnaps, 'validateAmountMultichain')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns validateAmountWithSnap function', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: MOCK_ASSET,
      fromAccount: MOCK_ACCOUNT,
      value: '1.5',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(() => useSnapAmountOnInput());

    expect(result.current.validateAmountWithSnap).toBeDefined();
    expect(typeof result.current.validateAmountWithSnap).toBe('function');
  });

  it('calls validateAmountMultichain with correct parameters', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: MOCK_ASSET,
      fromAccount: MOCK_ACCOUNT,
      value: '1.5',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(() => useSnapAmountOnInput());
    await result.current.validateAmountWithSnap('2.5');

    expect(validateAmountMultichainMock).toHaveBeenCalledWith(MOCK_ACCOUNT, {
      value: '2.5',
      accountId: MOCK_ACCOUNT.id,
      assetId: MOCK_ASSET.assetId,
    });
  });

  it('returns validation result from validateAmountMultichain', async () => {
    const mockValidationResult = { error: 'Insufficient balance' };
    validateAmountMultichainMock.mockResolvedValue(mockValidationResult);

    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: MOCK_ASSET,
      fromAccount: MOCK_ACCOUNT,
      value: '1.5',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(() => useSnapAmountOnInput());
    const validationResult = await result.current.validateAmountWithSnap('10');

    expect(validationResult).toEqual(mockValidationResult);
  });

  it('returns undefined when validation passes', async () => {
    validateAmountMultichainMock.mockResolvedValue(undefined);

    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: MOCK_ASSET,
      fromAccount: MOCK_ACCOUNT,
      value: '1.5',
    } as unknown as SendContext.SendContextType);

    const { result } = renderHookWithProvider(() => useSnapAmountOnInput());
    const validationResult = await result.current.validateAmountWithSnap('0.5');

    expect(validationResult).toBeUndefined();
  });
});
