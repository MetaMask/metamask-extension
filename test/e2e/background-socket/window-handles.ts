import log from 'loglevel';
import { ThenableWebDriver } from 'selenium-webdriver';
import { getServerMochaToBackground } from './server-mocha-to-background';
import { Handle, WindowProperties } from './types';

/**
 * Keeps a list of window handles and their properties (title, url).
 * Takes control of switchToWindowWithTitle and switchToWindowWithUrl away from driver.js
 */
export class WindowHandles {
  driver: ThenableWebDriver;

  rawHandles: string[] = [];

  annotatedHandles: Handle[] = [];

  constructor(driver: ThenableWebDriver) {
    this.driver = driver;
  }

  // Gets all window handles and annotates them with title and url
  async getAllWindowHandles() {
    this.rawHandles = await this.driver.getAllWindowHandles();

    this.updateAnnotatedHandles();

    log.debug('rawHandles', this.rawHandles);
    log.debug('annotatedHandles', this.annotatedHandles);

    return this.rawHandles;
  }

  // Remove outdated annotatedHandles and add new annotatedHandles
  updateAnnotatedHandles() {
    // Remove any annotatedHandles that are no longer present
    for (let i = 0; i < this.annotatedHandles.length; i++) {
      const handleId = this.annotatedHandles[i].id;
      if (this.rawHandles.indexOf(handleId) === -1) {
        log.debug('Removing handle:', this.annotatedHandles[i]);
        this.annotatedHandles.splice(i, 1);
        i -= 1;
      }
    }

    // Add any new rawHandles to the annotatedHandles
    for (const handleId of this.rawHandles) {
      if (!this.annotatedHandles.find((a) => a.id === handleId)) {
        this.annotatedHandles.push({ id: handleId, title: '', url: '' });
      }
    }
  }

  /**
   * Get the given property (title or url) of the current window.
   *
   * @param property - 'title' or 'url'
   * @param optionalCurrentHandle - If we already know the current handle, we can pass it in here
   * @returns Depending on `property`, returns the title or url of the current window, or null if no return value is requested
   */
  async getCurrentWindowProperties(
    property?: WindowProperties,
    optionalCurrentHandle?: string,
  ) {
    const currentHandle =
      optionalCurrentHandle || (await this.driver.getWindowHandle());

    let currentTitle, currentUrl;

    // Wait 25 x 200ms = 5 seconds for the title and url to be set
    for (let i = 0; i < 25 && !currentTitle && !currentUrl; i++) {
      currentTitle = await this.driver.getTitle();
      currentUrl = await this.driver.getCurrentUrl();

      if (!currentTitle || !currentUrl) {
        await this.driver.sleep(200);
      }
    }

    if (!currentTitle || !currentUrl) {
      log.debug(
        'Cannot get properties of current window',
        currentHandle,
        currentTitle,
        currentUrl,
      );
      return null;
    }

    let annotatedHandle = this.annotatedHandles.find(
      (a) => a.id === currentHandle,
    );

    if (annotatedHandle) {
      // Handle already there, update it
      annotatedHandle.title = currentTitle;
      annotatedHandle.url = currentUrl;
    } else {
      // Handle not there, add it
      annotatedHandle = {
        id: currentHandle,
        title: currentTitle,
        url: currentUrl,
      };
      this.annotatedHandles.push(annotatedHandle);
    }

    if (property) {
      // Return the current title or url
      return annotatedHandle[property];
    }

    // Didn't ask for any return value
    return null;
  }

  // Count the number of handles with an unknown title
  countUntitledHandles() {
    return this.annotatedHandles.filter((a) => !a.title).length;
  }

  // Count the number of handles with an unknown template property
  countHandlesWithoutProperty(property: WindowProperties) {
    return this.annotatedHandles.filter((a) => !a[property]).length;
  }

  /**
   * Switches the context of the browser session to the window/tab with the given property.
   *
   * You can think of this kind of like a template function:
   * If `property` is `title`, then this becomes `switchToWindowWithTitle`
   * If `property` is `url`, then this becomes `switchToWindowWithUrl`
   * Remember that `a[property]` becomes `a.title` or `a.url`
   *
   * @param property - 'title' or 'url'
   * @param value - The value we're searching for and want to switch to
   * @returns The handle of the window tab with the given property value
   */
  async switchToWindowWithProperty(property: WindowProperties, value: string) {
    // Ask the extension to wait until the window with the given property is open
    // (just ignore the return value here, because the tabs are not in the same order as driver.getAllWindowHandles())
    await getServerMochaToBackground().waitUntilWindowWithProperty(
      property,
      value,
    );

    await this.getAllWindowHandles();

    // See if we already know the handle by annotation
    const handle = this.annotatedHandles.find((a) => a[property] === value);
    let handleId = handle?.id;

    // If there's exactly one un-annotated handle, we should try it
    if (!handleId) {
      if (this.countHandlesWithoutProperty(property) === 1) {
        handleId = this.annotatedHandles.find((a) => !a[property])?.id;
      }
    }

    // Do the actual switching for the one we found
    if (handleId) {
      const matchesProperty = await this.switchToHandleAndCheckForProperty(
        handleId,
        property,
        value,
      );

      if (matchesProperty) {
        return handleId;
      }
    }

    // We have not found it in the annotatedHandles, or the one we found was wrong, so we have to cycle through all
    // handles and bring them into focus to get their titles/urls. There is no need for repeats or delays, because
    // ServerMochaToBackground has already waited for the tab to be found
    for (handleId of this.rawHandles) {
      const matchesProperty = await this.switchToHandleAndCheckForProperty(
        handleId,
        property,
        value,
      );

      if (matchesProperty) {
        return handleId;
      }
    }

    // If we still haven't found it, throw an error
    throw new Error(`No window with ${property}: ${value}`);
  }

  /**
   * Switches the window and makes sure it matches the expected title or url.
   *
   * @param handleId - The handle we want to switch to
   * @param property - 'title' or 'url'
   * @param value - The value we're searching for and want to switch to
   * @returns Whether the window we switched to has the expected property value
   */
  async switchToHandleAndCheckForProperty(
    handleId: string,
    property: WindowProperties,
    value: string,
  ): Promise<boolean> {
    await this.driver.switchTo().window(handleId);
    const handleProperty = await this.getCurrentWindowProperties(
      property,
      handleId,
    );

    return handleProperty === value;
  }

  /**
   * If we already know this window, switch to it
   * Otherwise, return null
   * This is used in helpers.switchToOrOpenDapp() and when there's an alert open
   *
   * @param title - The title of the window we want to switch to
   */
  async switchToWindowIfKnown(title: string) {
    const handle = this.annotatedHandles.find((a) => a.title === title);
    const handleId = handle?.id;

    if (handleId) {
      await this.driver.switchTo().window(handleId);
      return handleId;
    }

    return null;
  }
}
