import { isManifestV3 } from '../../../../../shared/modules/mv3.utils';
import {
  completeSRPRevealQuiz,
  openSRPRevealQuiz,
  tapAndHoldToRevealSRP,
} from '../../../helpers';
import { Driver } from '../../../webdriver/driver';

export const IS_ACCOUNT_SYNCING_ENABLED = isManifestV3;

export const getSRP = async (driver: Driver, password: string) => {
  await openSRPRevealQuiz(driver);
  await completeSRPRevealQuiz(driver);
  await driver.fill('[data-testid="input-password"]', password);
  await driver.press('[data-testid="input-password"]', driver.Key.ENTER);
  await tapAndHoldToRevealSRP(driver);
  return (await driver.findElement('[data-testid="srp_text"]')).getText();
};
