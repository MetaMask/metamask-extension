import { Driver } from '../../webdriver/driver';
import { DAPP_URL, WINDOW_TITLES } from '../../constants';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import ContractAddressRegistry from '../../seeder/contract-address-registry';
import TestDapp from '../pages/test-dapp';
import SetApprovalForAllTransactionConfirmation from '../pages/confirmations/set-approval-for-all-transaction-confirmation';

type TokenPermissionAssetType = 'erc721' | 'erc1155';
type TokenPermissionAction = 'revoke' | 'setApprovalForAll';
type TokenPermissionsOptions = {
  assetType: TokenPermissionAssetType;
  action: TokenPermissionAction;
  contractRegistry?: ContractAddressRegistry;
};

/**
 * Creates and confirms an NFT setApprovalForAll/revoke transaction
 * based on token standard and action.
 *
 * @param driver - The webdriver instance.
 * @param options - Token permission transaction options.
 */
export const setTokenPermissions = async (
  driver: Driver,
  options: TokenPermissionsOptions,
): Promise<void> => {
  const { assetType, action, contractRegistry } = options;
  if (!contractRegistry) {
    throw new Error('Missing contract registry');
  }

  const contractAddress = await contractRegistry.getContractAddress(
    SMART_CONTRACTS.NFTS,
  );
  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  if (action === 'revoke') {
    switch (assetType) {
      case 'erc721':
        await testDapp.clickERC721RevokeSetApprovalForAllButton();
        break;
      case 'erc1155':
        await testDapp.clickERC1155RevokeSetApprovalForAllButton();
        break;
      default:
        throw new Error('Unsupported token permission asset type');
    }
  } else {
    switch (assetType) {
      case 'erc721':
        await testDapp.clickERC721SetApprovalForAllButton();
        break;
      case 'erc1155':
        await testDapp.clickERC1155SetApprovalForAllButton();
        break;
      default:
        throw new Error('Unsupported token permission asset type');
    }
  }

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const setApprovalForAllConfirmation =
    new SetApprovalForAllTransactionConfirmation(driver);

  if (action === 'revoke') {
    await setApprovalForAllConfirmation.checkRevokeSetApprovalForAllTitle();
  } else {
    await setApprovalForAllConfirmation.checkSetApprovalForAllTitle();
    await setApprovalForAllConfirmation.checkSetApprovalForAllSubHeading();
  }

  await setApprovalForAllConfirmation.clickScrollToBottomButton();
  await setApprovalForAllConfirmation.clickFooterConfirmButton();
};
