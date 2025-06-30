import { withFixtures, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import SnapInteractiveDialog from '../page-objects/pages/dialog/snap-interactive-dialog';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { mockInteractiveUiSnap } from '../mock-response-data/snaps/snap-binary-mocks';

describe('Interactive UI Snap', function () {
  it('validate the interactive ui elements', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockInteractiveUiSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const interactiveUI = new SnapInteractiveDialog(driver);

        // Navigate to test snaps page, connect interactive UI snap and validate
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectInteractiveButton',
        );
        await testSnaps.check_installationComplete(
          'connectInteractiveButton',
          'Reconnect to Interactive UI Snap',
        );

        // click create dialog button
        await testSnaps.scrollAndClickButton('createDialogButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await interactiveUI.check_pageIsLoaded();

        // fill in the details in the example dialog
        await interactiveUI.fillMessage('foo bar');
        await interactiveUI.scrollToSelectorDropDown();
        await interactiveUI.selectDropDownOption('selector', 'Option 3');
        await interactiveUI.selectRadioOption('Option 1');
        await interactiveUI.selectDropDownOption('dropDown', 'Option 2');
        await interactiveUI.selectCheckbox();
        await interactiveUI.clickSubmitButton();

        // check for returned values and close the dialog
        await interactiveUI.check_result();
        await interactiveUI.clickOKButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.check_messageResultSpan(
          'interactiveUIResultSpan',
          'null',
        );

        // validate the disabled elements in the dialog
        await testSnaps.clickButton('createDialogDisabledButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await interactiveUI.checkElementIsDisabled('exampleInput');
        await interactiveUI.checkElementIsDisabled('exampleDropdown');
        await interactiveUI.checkElementIsDisabled('exampleCheckbox');
        await interactiveUI.checkElementIsDisabled('exampleSelectorDropdown');
        await interactiveUI.clickCancelButton();
      },
    );
  });
});
