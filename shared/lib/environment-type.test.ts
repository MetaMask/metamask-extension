import {
  ENVIRONMENT_TYPE_BACKGROUND,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../constants/app';
import { getEnvironmentType } from './environment-type';

describe('getEnvironmentType', () => {
  it('returns popup type', () => {
    const environmentType = getEnvironmentType(
      'http://extension-id/popup.html',
    );
    expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_POPUP);
  });

  it('returns notification type', () => {
    const environmentType = getEnvironmentType(
      'http://extension-id/notification.html',
    );
    expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_NOTIFICATION);
  });

  it('returns fullscreen type for home.html', () => {
    const environmentType = getEnvironmentType(
      'http://extension-id/home.html',
    );
    expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_FULLSCREEN);
  });

  it('returns background type', () => {
    const environmentType = getEnvironmentType(
      'http://extension-id/_generated_background_page.html',
    );
    expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_BACKGROUND);
  });

  it('returns the correct type for a URL with a hash fragment', () => {
    const environmentType = getEnvironmentType(
      'http://extension-id/popup.html#hash',
    );
    expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_POPUP);
  });

  it('returns the correct type for a URL with query parameters', () => {
    const environmentType = getEnvironmentType(
      'http://extension-id/popup.html?param=foo',
    );
    expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_POPUP);
  });

  it('returns the correct type for a URL with query parameters and a hash fragment', () => {
    const environmentType = getEnvironmentType(
      'http://extension-id/popup.html?param=foo#hash',
    );
    expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_POPUP);
  });
});
