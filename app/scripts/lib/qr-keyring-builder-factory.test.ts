import { RLP } from '@ethereumjs/rlp';
import { Common, Hardfork } from '@ethereumjs/common';
import {
  FeeMarketEIP1559Transaction,
  LegacyTransaction,
  TransactionType,
  type TypedTransaction,
} from '@ethereumjs/tx';
import {
  DataType,
  EthSignRequest,
} from '@keystonehq/bc-ur-registry-eth';
import {
  QrKeyring,
  QrScanRequestType,
  type QrScanRequest,
} from '@metamask/eth-qr-keyring';

const SIGNER_ADDRESS = '0x8DC309e828CE024b1ae7a9AA7882D37AD18181d5';
const SIGNER_PATH = "M/44'/60'/0'/0/0";
const DECODED_SIGNER_PATH = "44'/60'/0'/0/0";
const SOURCE_FINGERPRINT = '65174ca1';
const CAPTURED_REQUEST_ERROR = 'Captured QR sign request';

type ContractSigningFixture = {
  name: string;
  dataType: DataType;
  transaction: TypedTransaction;
  contractData: string;
};

describe('QrKeyring OneKey transaction compatibility', () => {
  describe('signTransaction', () => {
    it.each([
      buildERC20SigningFixture(),
      buildERC721DeploymentFixture(),
      buildERC721MintSigningFixture(),
    ])('includes signer address for $name', async ({ transaction }) => {
      const { keyring, getCapturedRequest } = await buildInitializedQrKeyring();

      await expect(
        keyring.signTransaction(SIGNER_ADDRESS, transaction),
      ).rejects.toThrow(CAPTURED_REQUEST_ERROR);

      const ethSignRequest = decodeCapturedEthSignRequest(getCapturedRequest());

      expect(ethSignRequest.getSignRequestAddress()?.toString('hex')).toBe(
        SIGNER_ADDRESS.toLowerCase().replace('0x', ''),
      );
    });

    it.each([
      buildERC20SigningFixture(),
      buildERC721DeploymentFixture(),
      buildERC721MintSigningFixture(),
    ])(
      'preserves transaction payload fields for $name',
      async ({ transaction, dataType, contractData }) => {
        const { keyring, getCapturedRequest } = await buildInitializedQrKeyring();

        await expect(
          keyring.signTransaction(SIGNER_ADDRESS, transaction),
        ).rejects.toThrow(CAPTURED_REQUEST_ERROR);

        const ethSignRequest = decodeCapturedEthSignRequest(
          getCapturedRequest(),
        );

        expect(ethSignRequest.getDataType()).toBe(dataType);
        expect(ethSignRequest.getChainId()).toBe(1);
        expect(ethSignRequest.getDerivationPath()).toBe(DECODED_SIGNER_PATH);
        expect(ethSignRequest.getSourceFingerprint().toString('hex')).toBe(
          SOURCE_FINGERPRINT,
        );
        expect(ethSignRequest.getSignData().toString('hex')).toBe(
          getExpectedSignData(transaction),
        );
        expect(ethSignRequest.getSignData().toString('hex')).toContain(
          contractData.replace('0x', ''),
        );
      },
    );
  });
});

async function buildInitializedQrKeyring() {
  let capturedRequest: QrScanRequest | undefined;
  const keyring = new QrKeyring({
    bridge: {
      requestScan: async (request: QrScanRequest) => {
        capturedRequest = request;
        throw new Error(CAPTURED_REQUEST_ERROR);
      },
    },
  });

  await keyring.deserialize({
    initialized: true,
    keyringMode: 'account',
    keyringAccount: 'OneKey',
    name: 'OneKey',
    xfp: SOURCE_FINGERPRINT,
    paths: {
      [SIGNER_ADDRESS]: SIGNER_PATH,
    },
    indexes: {},
    accounts: [SIGNER_ADDRESS],
  });

  return {
    keyring,
    getCapturedRequest: () => {
      if (!capturedRequest) {
        throw new Error('Expected QR sign request to be captured');
      }
      return capturedRequest;
    },
  };
}

function decodeCapturedEthSignRequest(request: QrScanRequest): EthSignRequest {
  expect(request.type).toBe(QrScanRequestType.SIGN);
  expect(request.request?.payload.type).toBe('eth-sign-request');

  return EthSignRequest.fromCBOR(
    Buffer.from(request.request?.payload.cbor ?? '', 'hex'),
  );
}

function getExpectedSignData(transaction: TypedTransaction): string {
  const messageToSign = transaction.getMessageToSign();
  const signData = Array.isArray(messageToSign)
    ? RLP.encode(messageToSign)
    : messageToSign;

  return Buffer.from(signData).toString('hex');
}

function buildERC20SigningFixture(): ContractSigningFixture {
  const transferSelector = 'a9059cbb';
  const recipient = '0000000000000000000000001111111111111111111111111111111111111111';
  const amount = '0000000000000000000000000000000000000000000000000000000000000001';
  const contractData = `0x${transferSelector}${recipient}${amount}`;

  return {
    name: 'ERC20 contract signing',
    dataType: DataType.typedTransaction,
    transaction: FeeMarketEIP1559Transaction.fromTxData(
      {
        type: TransactionType.FeeMarketEIP1559,
        chainId: 1,
        nonce: 0,
        maxPriorityFeePerGas: 1,
        maxFeePerGas: 2,
        gasLimit: 100_000,
        to: '0x2222222222222222222222222222222222222222',
        value: 0,
        data: contractData,
        accessList: [],
      },
      { common: buildCommon(Hardfork.London) },
    ),
    contractData,
  };
}

function buildERC721DeploymentFixture(): ContractSigningFixture {
  const contractData =
    '0x608060405234801561001057600080fd5b5060405161010038038061010083398101604081905261002f9161003b565b806000819055505061005b565b60006020828403121561004d57600080fd5b5051919050565b603f806100696000396000f3fe6080604052600080fdfea2646970667358221220';

  return {
    name: 'ERC721 deployment',
    dataType: DataType.transaction,
    transaction: LegacyTransaction.fromTxData(
      {
        nonce: 0,
        gasPrice: 1,
        gasLimit: 1_500_000,
        value: 0,
        data: contractData,
      },
      { common: buildCommon(Hardfork.Istanbul) },
    ),
    contractData,
  };
}

function buildERC721MintSigningFixture(): ContractSigningFixture {
  const mintSelector = '40c10f19';
  const recipient = '0000000000000000000000003333333333333333333333333333333333333333';
  const tokenId = '0000000000000000000000000000000000000000000000000000000000000007';
  const contractData = `0x${mintSelector}${recipient}${tokenId}`;

  return {
    name: 'ERC721 mint signing',
    dataType: DataType.typedTransaction,
    transaction: FeeMarketEIP1559Transaction.fromTxData(
      {
        type: TransactionType.FeeMarketEIP1559,
        chainId: 1,
        nonce: 1,
        maxPriorityFeePerGas: 1,
        maxFeePerGas: 2,
        gasLimit: 150_000,
        to: '0x4444444444444444444444444444444444444444',
        value: 0,
        data: contractData,
        accessList: [],
      },
      { common: buildCommon(Hardfork.London) },
    ),
    contractData,
  };
}

function buildCommon(hardfork: Hardfork): Common {
  return Common.custom(
    {
      name: 'mainnet',
      chainId: 1,
      networkId: 1,
    },
    { hardfork },
  );
}
