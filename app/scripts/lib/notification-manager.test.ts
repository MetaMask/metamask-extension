import browser from 'webextension-polyfill';
import NotificationManager from './notification-manager';

function generateMockWindow(overrides?: object) {
  return {
    alwaysOnTop: false,
    focused: true,
    height: 620,
    width: 360,
    id: 1312883868,
    incognito: false,
    left: 1326,
    state: 'normal',
    tabs: [
      {
        active: true,
        audible: false,
        autoDiscardable: true,
        discarded: false,
        groupId: -1,
      },
    ],
    top: 25,
    type: 'popup',
    ...overrides,
  };
}

jest.mock('webextension-polyfill', () => {
  return {
    windows: {
      onRemoved: {
        addListener: jest.fn(),
      },
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
});

describe('Notification Manager', () => {
  let notificationManager: NotificationManager,
    setCurrentPopupIdSpy: (a: number) => void,
    focusWindowSpy: () => void,
    currentPopupId: number;

  beforeEach(() => {
    notificationManager = new NotificationManager();
  });

  it('should not create a new popup window if there is one', async () => {
    focusWindowSpy = jest.fn();
    browser.windows.getAll.mockReturnValue([generateMockWindow()]);
    browser.windows.update.mockImplementation(focusWindowSpy);
    currentPopupId = 1312883868;
    await notificationManager.showPopup(setCurrentPopupIdSpy, currentPopupId);
    expect(focusWindowSpy).toHaveBeenCalledTimes(1);
  });

  it('should create a new popup window if there is no existing one', async () => {
    const newPopupWindow = generateMockWindow();
    setCurrentPopupIdSpy = jest.fn();
    browser.windows.getAll.mockReturnValue([]);
    browser.windows.create.mockReturnValue(newPopupWindow);
    currentPopupId = undefined;
    await notificationManager.showPopup(setCurrentPopupIdSpy, currentPopupId);
    expect(setCurrentPopupIdSpy).toHaveBeenCalledTimes(1);
    expect(setCurrentPopupIdSpy).toHaveBeenCalledWith(newPopupWindow.id);
  });
});
