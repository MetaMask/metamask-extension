import { test as pwTest, expect } from '@playwright/test';
import baseManifest from '../../../../app/manifest/v3/_base.json';
import chromeManifest from '../../../../app/manifest/v3/chrome.json';
import { runSignedExtensionUpdateProbe } from '../../playwright/shared/signed-extension-update';

// This requires Chrome's signed updater and its real permission-increase checks;
// mocked browser APIs and unpacked extension reloads cannot cover the contract.
pwTest(
  'adds DNR through a signed update without requiring new consent',
  async (
    // eslint-disable-next-line no-empty-pattern
    {},
    testInfo,
  ) => {
    pwTest.skip(testInfo.project.name !== 'chrome-e2e');
    expect(baseManifest.permissions).toContain(
      'declarativeNetRequestWithHostAccess',
    );
    expect(baseManifest.permissions).not.toContain('downloads');

    const { baseline, candidate, negativeControl, downloads } =
      await runSignedExtensionUpdateProbe({
        hostPermissions: baseManifest.host_permissions,
        minimumChromeVersion: chromeManifest.minimum_chrome_version,
        permissions: baseManifest.permissions,
      });

    expect(baseline.state).toBe('ENABLED');
    expect(baseline.location).not.toBe('UNPACKED');
    expect(candidate.state).toBe('ENABLED');
    expect(candidate.permissions).toEqual(baseline.permissions);
    expect(downloads).toEqual(['/2.0.crx', '/3.0.crx']);
    // The extra downloads warning must disable this update. If it stays enabled,
    // the harness is bypassing consent and cannot establish the positive result.
    expect(negativeControl.state).toBe('DISABLED');
  },
);
