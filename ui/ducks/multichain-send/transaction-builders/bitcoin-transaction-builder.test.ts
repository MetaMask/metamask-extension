import { BitcoinTransactionBuilder } from './bitcoin-transaction-builder';

describe('BitcoinTransactionBuilder', () => {
  let builder: BitcoinTransactionBuilder;

  beforeEach(() => {
    // Initialize the builder with mock data
    builder = new BitcoinTransactionBuilder(
      /* mock thunkApi */,
      /* mock account */,
      /* mock network */,
      /* mock transactionParams */
    );
  });

  it('should set the amount correctly', () => {
    const amount = '0.01';
    const result = builder.setAmount(amount);

    expect(result).toEqual({
      sendAsset: {
        type: 'BTC',
        value: amount,
      },
    });
  });

  it('should build the transaction correctly', () => {
    builder.setAmount('0.01');
    const result = builder.buildTransaction();

    expect(result).toBeUndefined();
    // Additional assertions can be added here to check the generated transaction
  });

  it('should estimate the gas correctly', async () => {
    const result = await builder.estimateGas();

    expect(result).toEqual({
      fee: '0.0001',
      gasLimit: '21000',
    });
  });

  it('should query the asset balance correctly', async () => {
    const result = await builder.queryAssetBalance();

    expect(result).toEqual({
      amount: '1.2345',
      unit: 'BTC',
    });
  });

  it('should validate the transaction correctly', () => {
    const result = builder.validateTransaction();

    expect(result).toBe(true);
  });

  it('should set the send asset correctly', () => {
    const asset = 'BTC';
    const result = builder.setSendAsset(asset);

    expect(result).toEqual({
      sendAsset: {
        type: asset,
      },
    });
  });

  it('should set the network correctly', () => {
    const network = 'bitcoin';
    const result = builder.setNetwork(network);

    expect(result).toEqual({
      network: network,
    });
  });

  it('should set the fee correctly', async () => {
    const fee = 'standard';
    const result = await builder.setFee(fee);

    expect(result).toEqual({
      fee: fee,
    });
  });

  it('should set the recipient correctly', () => {
    const recipient = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    const result = builder.setRecipient(recipient);

    expect(result).toEqual({
      recipient: recipient,
    });
  });

  it('should sign the transaction correctly', async () => {
    const result = await builder.signTransaction();

    expect(result).toEqual('signedTransaction');
  });

  it('should send the transaction correctly', async () => {
    const result = await builder.sendTransaction();

    expect(result).toEqual('transactionHash');
  });

  it('should get the cached account balance correctly', () => {
    const result = builder.getCachedAccountBalance();

    expect(result).toEqual('1.2345');
  });

  it('should set the max send amount correctly', async () => {
    const result = await builder.setMaxSendAmount();

    expect(result).toEqual('1.2345');
  });
});