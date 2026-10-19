import { Key, WebDriver, WebElement, error } from 'selenium-webdriver';
import type { IWebElementId } from 'selenium-webdriver';
import { Command, Name } from 'selenium-webdriver/lib/command';

const affectedCommands = new Set([
  Name.CLICK_ELEMENT,
  Name.CLEAR_ELEMENT,
  Name.SEND_KEYS_TO_ELEMENT,
]);

/**
 * Work around ChromeDriver 145's legacy atoms in a locked-down realm. Their
 * goog.base helper reads arguments.callee.caller, which SES removes. Keep the
 * normal WebDriver path (including its errors) unless that specific atom fails.
 * Native Actions preserve trusted input events without changing the extension.
 *
 * @param driver - Chrome driver built with the webSocketUrl capability enabled.
 */
export function installChromeAtomWorkaround(driver: WebDriver): void {
  const executor = driver.getExecutor();
  const execute = executor.execute.bind(executor);
  executor.execute = async (command: Command) => {
    // The HTTP executor removes URL parameters while building the request.
    const elementId = command.getParameter('id') as IWebElementId;
    const text = command.getParameter('text') as string;
    try {
      return await execute(command);
    } catch (exception) {
      if (
        !affectedCommands.has(command.getName()) ||
        !(exception instanceof error.JavascriptError) ||
        !/Cannot read properties of undefined \(reading '(?:ka|Aa)'\)/u.test(
          exception.message,
        )
      ) {
        throw exception;
      }
    }

    const element = new WebElement(driver, WebElement.extractId(elementId));
    if (command.getName() === Name.CLICK_ELEMENT) {
      const container = await driver.executeScript<WebElement>(
        `const element = arguments[0];
        return element.tagName === 'OPTION' ? element.closest('select') : element;`,
        element,
      );
      // Actions alone would click an overlay, whereas Element Click must reject
      // an intercepted click. Check the same in-view center used by Actions.
      const interactable = await driver.executeScript(
        `const element = arguments[0];
        element.scrollIntoView({block: 'center', inline: 'center'});
        const rect = element.getClientRects()[0];
        if (!rect || !rect.width || !rect.height) return 'hidden';
        const x = (Math.max(0, rect.left) + Math.min(innerWidth, rect.right)) / 2;
        const y = (Math.max(0, rect.top) + Math.min(innerHeight, rect.bottom)) / 2;
        const target = element.getRootNode().elementFromPoint(x, y);
        return element === target || element.contains(target) ? 'visible' : 'covered';`,
        container,
      );
      if (interactable === 'hidden') {
        throw new error.ElementNotInteractableError('Element has no size');
      }
      if (interactable === 'covered') {
        throw new error.ElementClickInterceptedError('Element is covered');
      }
      // Options in a collapsed select have no box of their own. Follow the
      // option-specific Element Click steps, as ChromeDriver's atom does:
      // https://w3c.github.io/webdriver/#element-click
      const selectedOption = await driver.executeScript<boolean>(
        `const option = arguments[0], select = arguments[1];
        if (option.tagName !== 'OPTION') return false;
        const fire = type => {
          const mouse = !['input', 'change'].includes(type);
          const event = select.ownerDocument.createEvent(mouse ? 'MouseEvents' : 'Event');
          if (mouse) {
            event.initMouseEvent(type, true, true, select.ownerDocument.defaultView,
              0, 0, 0, 0, 0, false, false, false, false, 0, null);
          } else {
            event.initEvent(type, true, false);
          }
          select.dispatchEvent(event);
        };
        for (const type of ['mouseover', 'mousemove', 'mousedown']) fire(type);
        select.focus();
        if (!select.disabled && !option.matches(':disabled')) {
          fire('input');
          const wasSelected = option.selected;
          option.selected = select.multiple ? !wasSelected : true;
          if (!wasSelected) fire('change');
        }
        for (const type of ['mouseup', 'click']) fire(type);
        return true;`,
        element,
        container,
      );
      if (selectedOption) {
        return;
      }
      return driver.actions().click(element).perform();
    }

    const inputType = await driver.executeScript<string>(
      'return arguments[0].type;',
      element,
    );
    if (inputType === 'file') {
      // Keyboard Actions cannot populate file inputs. BiDi accepts the same
      // shared element reference and uploads through the browser's native API.
      const bidi = await driver.getBidi();
      const response = (await bidi.send({
        method: 'input.setFiles',
        params: {
          context: await driver.getWindowHandle(),
          element: { sharedId: await element.getId() },
          files:
            command.getName() === Name.CLEAR_ELEMENT ? [] : text.split('\n'),
        },
      })) as { type: string; error: string; message: string };
      if (response.type === 'error') {
        error.throwDecodedError(response);
      }
      return;
    }

    const focused = await driver.executeScript<boolean | 'invalid'>(
      `const element = arguments[0];
      if (arguments[1] && (element.readOnly || element.matches(':disabled') ||
          (!element.isContentEditable && element.tagName !== 'TEXTAREA' &&
           !(element.tagName === 'INPUT' &&
             ['text', 'search', 'url', 'tel', 'email', 'password', 'number'].includes(element.type))))) {
        return 'invalid';
      }
      if (element.matches(':disabled') || !element.getClientRects().length) return false;
      if (element.getRootNode().activeElement !== element) {
        element.focus();
        if (['text', 'search', 'url', 'tel', 'password'].includes(element.type)) {
          element.setSelectionRange(element.value.length, element.value.length);
        }
      }
      return element.getRootNode().activeElement === element;`,
      element,
      command.getName() === Name.CLEAR_ELEMENT,
    );
    if (focused === 'invalid') {
      throw new error.InvalidElementStateError('Element is not editable text');
    }
    if (!focused) {
      throw new error.ElementNotInteractableError(
        'Element cannot receive keys',
      );
    }

    const keys =
      command.getName() === Name.CLEAR_ELEMENT
        ? Key.chord(
            process.platform === 'darwin' ? Key.META : Key.CONTROL,
            'a',
            Key.BACK_SPACE,
          )
        : text;
    const actions = driver.actions();
    const modifiers = new Set<string>();
    for (const key of keys) {
      if (key === Key.NULL) {
        for (const modifier of modifiers) {
          actions.keyUp(modifier);
        }
        modifiers.clear();
      } else if ([Key.SHIFT, Key.CONTROL, Key.ALT, Key.META].includes(key)) {
        if (modifiers.has(key)) {
          actions.keyUp(key);
          modifiers.delete(key);
        } else {
          actions.keyDown(key);
          modifiers.add(key);
        }
      } else {
        actions.sendKeys(key);
      }
    }
    for (const modifier of modifiers) {
      actions.keyUp(modifier);
    }
    await actions.perform();
  };
}
