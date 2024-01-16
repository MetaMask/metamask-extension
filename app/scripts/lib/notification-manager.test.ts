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
      getLastFocused: jest.fn(),
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

  it('should not pass negative left value for extension window created from last focused window', async () => {
    const newPopupWindow = generateMockWindow();
    setCurrentPopupIdSpy = jest.fn();
    const createSpy = jest.fn().mockReturnValue(newPopupWindow);
    browser.windows.getAll.mockReturnValue([]);
    browser.windows.create = createSpy;
    browser.windows.getLastFocused.mockReturnValue({
      top: 0,
      left: 0,
      width: 120, // make sure this is smalled than NOTIFICATION_WIDTH
    });
    currentPopupId = undefined;
    await notificationManager.showPopup(setCurrentPopupIdSpy, currentPopupId);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith({
      height: 620,
      left: 0, // this is critical, means error related to polyfill is not triggered
      top: 0,
      type: 'popup',
      url: 'notification.html',
      width: 360,
    });
  });
});
