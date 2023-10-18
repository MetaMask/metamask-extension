import MetamaskController from '../../metamask-controller';
import {
  TransactionStatus,
  TransactionType,
  TransactionMeta,
} from '../../../../shared/constants/transaction';
import { createSwapsTransaction } from './swaps'; // replace with your actual file path

jest.mock('../../metamask-controller');

describe('createSwapsTransaction', () => {
  let metamaskController;
  let swapOptions;
  let transactionType;
  let transactionMeta;

  beforeEach(() => {
    metamaskController = {
      txController: {
        cancelTransaction: jest.fn(),
        updateTransactionSwapProperties: jest.fn(),
      },
      swapsController: {
        setApproveTxId: jest.fn(),
        setTradeTxId: jest.fn(),
      },
    } as unknown as MetamaskController;
    swapOptions = { hasApproveTx: false, meta: {} };
    transactionType = TransactionType.swap;
    transactionMeta = {
      id: '1',
      status: TransactionStatus.unapproved,
    } as TransactionMeta;
  });

  it('should throw an error if simulation fails', async () => {
    transactionMeta.simulationFails = true;
    await expect(
      createSwapsTransaction.call(
        metamaskController,
        swapOptions,
        transactionType,
        transactionMeta,
      ),
    ).rejects.toThrow('Simulation failed');
  });

  it('should return transaction meta if swaps meta is not defined', async () => {
    swapOptions.meta = undefined;
    await expect(
      createSwapsTransaction.call(
        metamaskController,
        swapOptions,
        transactionType,
        transactionMeta,
      ),
    ).resolves.toEqual(transactionMeta);
  });

  it('should return transaction meta if swaps meta is not defined', async () => {
    swapOptions.meta = undefined;
    await expect(
      createSwapsTransaction.call(
        metamaskController,
        swapOptions,
        transactionType,
        transactionMeta,
      ),
    ).resolves.toEqual(transactionMeta);
  });

  it.each([[TransactionType.swapApproval], [TransactionType.swap]])(
    'should throw if transaction is not unapproved and type is %s',
    (_) => {
      transactionMeta.status = TransactionStatus.confirmed;
      expect(
        createSwapsTransaction.call(
          metamaskController,
          swapOptions,
          transactionType,
          transactionMeta,
        ),
      ).rejects.toThrow(
        `TransactionsController: Can only call createSwapsTransaction on an unapproved transaction. Current tx status: ${TransactionStatus.confirmed}`,
      );
    },
  );

  describe('swap approval', () => {
    it('should return transaction meta with swap properties', async () => {
      const mockedSwapMeta = {
        type: TransactionType.swapApproval,
        sourceTokenSymbol: 'ETH',
      };

      transactionMeta.type = TransactionType.swapApproval;
      swapOptions.meta = {
        ...mockedSwapMeta,
      };

      const result = await createSwapsTransaction.call(
        metamaskController,
        swapOptions,
        TransactionType.swapApproval,
        transactionMeta,
      );

      expect(metamaskController.swapsController.setApproveTxId).toBeCalledTimes(
        1,
      );

      expect(
        metamaskController.txController.updateTransactionSwapProperties,
      ).toBeCalledTimes(1);
      expect(
        metamaskController.txController.updateTransactionSwapProperties,
      ).toBeCalledWith(transactionMeta.id, mockedSwapMeta);

      expect(result).toEqual({
        ...transactionMeta,
        ...mockedSwapMeta,
      });
    });
  });

  describe('swap', () => {
    it('should return transaction meta with swap properties', async () => {
      const mockedSwapMeta = {
        sourceTokenSymbol: 'ETH',
        destinationTokenSymbol: 'DAI',
        type: TransactionType.swap,
        destinationTokenDecimals: '18',
        destinationTokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
        swapMetaData: '0x',
        swapTokenValue: '0x',
        estimatedBaseFee: '0x',
        approvalTxId: '123',
      };

      transactionMeta.type = TransactionType.swap;
      swapOptions.meta = {
        ...mockedSwapMeta,
      };

      const result = await createSwapsTransaction.call(
        metamaskController,
        swapOptions,
        TransactionType.swap,
        transactionMeta,
      );

      expect(metamaskController.swapsController.setTradeTxId).toBeCalledTimes(
        1,
      );

      expect(
        metamaskController.txController.updateTransactionSwapProperties,
      ).toBeCalledTimes(1);
      expect(
        metamaskController.txController.updateTransactionSwapProperties,
      ).toBeCalledWith(transactionMeta.id, mockedSwapMeta);

      expect(result).toEqual({
        ...transactionMeta,
        ...mockedSwapMeta,
      });
    });
  });
});
