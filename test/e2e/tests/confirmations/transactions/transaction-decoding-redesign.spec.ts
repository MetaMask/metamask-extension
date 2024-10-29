/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { Mockttp, MockttpServer } from 'mockttp';
import {
  createDepositTransaction,
  openDAppWithContract,
  TestSuiteArguments,
} from './shared';

const {
  defaultGanacheOptions,
  withFixtures,
} = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign Contract Interaction Transaction Decoding', function () {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;

  describe('Create a deposit transaction @no-mmi', function () {
    it(`decodes 4 bytes transaction data`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: {
                redesignedConfirmationsEnabled: true,
                isRedesignedConfirmationsDeveloperEnabled: true,
              },
            })
            .build(),
          ganacheOptions: defaultGanacheOptions,
          testSpecificMock: mocked4BytesDeposit,
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await createDepositTransaction(driver);
          await driver.delay(90000);
        },
      );
    });
  });
});

async function mocked4BytesDeposit(mockServer: MockttpServer){
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .always()
    .withQuery({ hex_signature: '0xd0e30db0' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            created_at: '2016-07-09T03:58:29.617584Z',
            text_signature: 'deposit()',
            hex_signature: '0xd0e30db0',
            bytes_signature: 'Ðà\r°',
          }
        ],
      },
    }));
}


export const SOURCIFY_RESPONSE_NESTED = {
  files: [
    {
      name: 'metadata.json',
      content: JSON.stringify({
        output: {
          abi: [
            {
              inputs: [
                {
                  internalType: 'uint256',
                  name: 'amount',
                  type: 'uint256',
                },
              ],
              name: 'deposit',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          devdoc: {
            methods: {
              'deposit(uint256)': {
                details: 'Deposits the specified amount into the contract.',
                params: {
                  amount: 'The amount to be deposited',
                },
              },
            },
          },
          userdoc: {
            methods: {
              'deposit(uint256)': {
                notice: 'Allows a user to deposit a specific amount into the contract.',
              },
            },
            notice: 'Deposit function handles the transfer of a specified amount into the contract.',
          },
        },
      }),
    },
  ],
};
