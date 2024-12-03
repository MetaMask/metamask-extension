import { Suite } from "mocha";
import { withSolanaAccountSnap } from "./common-solana";
import HeaderNavbar from "../../page-objects/pages/header-navbar";

describe('Create Solana Account', function (this: Suite) {
  it('create Solana account from the menu', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.check_accountLabel('Solana account');
      },
    );
  });
});
