import { MockedEndpoint, MockttpServer } from 'mockttp';
import { Anvil } from '../../../seeder/anvil';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import { Mockttp } from '../../../mock-e2e';
import { buildFourByteSignatures } from '../../../mock-response-data/api-responses';

export type TestSuiteArguments = {
  driver: Driver;
  localNodes?: Anvil[] | undefined;
  contractRegistry?: ContractAddressRegistry;
  mockedEndpoint?: MockedEndpoint | MockedEndpoint[];
};

export async function toggleAdvancedDetails(driver: Driver) {
  // TODO - Scroll button not shown in Firefox if advanced details enabled too fast.
  await driver.delay(1000);

  await driver.clickElement(`[data-testid="header-advanced-details-button"]`);
}

export async function assertAdvancedGasDetails(driver: Driver) {
  await driver.waitForSelector({ testId: 'edit-gas-fees-row' });
  await driver.waitForSelector({ testId: 'gas-fee-details-speed' });
  await driver.waitForSelector({ testId: 'gas-fee-details-max-fee' });
}

export async function assertAdvancedGasDetailsWithFewerFields(driver: Driver) {
  await driver.waitForSelector({ testId: 'edit-gas-fees-row' });
  await driver.waitForSelector({ testId: 'gas-fee-details-speed' });
}

export async function mocked4BytesApprove(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .always()
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    .withQuery({ hex_signature: '0x095ea7b3' })
    .thenCallback(() => ({
      statusCode: 200,
      json: buildFourByteSignatures({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hex_signature: '0x095ea7b3',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        text_signature: 'approve(address,uint256)',
      }),
    }));
}

export async function mocked4BytesSetApprovalForAll(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    .withQuery({ hex_signature: '0xa22cb465' })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: buildFourByteSignatures({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hex_signature: '0xa22cb465',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        text_signature: 'setApprovalForAll(address,bool)',
      }),
    }));
}

export async function mocked4BytesIncreaseAllowance(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .always()
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    .withQuery({ hex_signature: '0x39509351' })
    .thenCallback(() => ({
      statusCode: 200,
      json: buildFourByteSignatures({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hex_signature: '0x39509351',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        text_signature: 'increaseAllowance(address,uint256)',
      }),
    }));
}
