/** @jest-environment node */
import { it } from '@jest/globals';
import {
  Capabilities,
  Key,
  Session,
  WebDriver,
  WebElement,
  error,
} from 'selenium-webdriver';
import { Command, Name } from 'selenium-webdriver/lib/command';
import { installChromeAtomWorkaround } from './chrome-atom-workaround';

describe('installChromeAtomWorkaround', () => {
  function setup({
    inputType = 'text',
    clickTarget = 'visible',
    focused = true as boolean | 'invalid',
    isOption = false,
    failure = new error.JavascriptError(
      "Cannot read properties of undefined (reading 'ka')",
    ),
  } = {}) {
    const bidiSend = jest.fn().mockResolvedValue({ type: 'success' });
    const execute = jest.fn(async (command: Command) => {
      if (
        [
          Name.CLICK_ELEMENT,
          Name.CLEAR_ELEMENT,
          Name.SEND_KEYS_TO_ELEMENT,
        ].includes(command.getName())
      ) {
        // Mirror HTTP routing's consumption of the element URL parameter.
        delete command.getParameters().id;
        throw failure;
      }
      if (command.getName() === Name.EXECUTE_SCRIPT) {
        const script = command.getParameter('script') as string;
        if (script.includes('return arguments[0].type')) {
          return inputType;
        }
        if (script.includes('scrollIntoView')) {
          return clickTarget;
        }
        if (script.includes("element.closest('select')")) {
          return WebElement.buildId(isOption ? 'select' : 'element');
        }
        if (script.includes('const option =')) {
          return isOption;
        }
        return focused;
      }
      if (command.getName() === Name.GET_CURRENT_WINDOW_HANDLE) {
        return 'window';
      }
      return undefined;
    });
    const driver = Object.assign(
      new WebDriver(new Session('session', new Capabilities()), { execute }),
      { getBidi: jest.fn().mockResolvedValue({ send: bidiSend }) },
    );
    installChromeAtomWorkaround(driver);
    const element = new WebElement(driver, 'element');
    const keyboardActions = () => {
      const command = execute.mock.calls.find(
        ([call]) => call.getName() === Name.ACTIONS,
      )?.[0];
      return command
        ?.getParameter('actions')
        .find((input: { type: string }) => input.type === 'key').actions;
    };
    return { driver, element, execute, bidiSend, keyboardActions, failure };
  }

  it('keeps successful native commands unchanged', async () => {
    const { element, execute } = setup();
    execute.mockResolvedValueOnce(undefined);

    await element.sendKeys('hello');

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it.each([
    new error.ElementClickInterceptedError('overlay'),
    new error.StaleElementReferenceError('stale'),
    new error.JavascriptError('unrelated application error'),
    new error.JavascriptError(
      "Cannot read properties of undefined (reading 'unrelated')",
    ),
  ])('propagates unrelated errors: %s', async (failure) => {
    const { element, execute } = setup({ failure });

    await expect(element.click()).rejects.toBe(failure);

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('does not retry other commands with a matching error', async () => {
    const { driver, execute, failure } = setup();
    execute.mockRejectedValueOnce(failure);

    await expect(driver.getTitle()).rejects.toBe(failure);

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('holds shortcut modifiers until NULL and releases them before typing more text', async () => {
    const { element, keyboardActions } = setup();

    await element.sendKeys(Key.chord(Key.CONTROL, 'v'), '🦊');

    expect(keyboardActions()).toStrictEqual([
      { type: 'keyDown', value: Key.CONTROL },
      { type: 'keyDown', value: 'v' },
      { type: 'keyUp', value: 'v' },
      { type: 'keyUp', value: Key.CONTROL },
      { type: 'keyDown', value: '🦊' },
      { type: 'keyUp', value: '🦊' },
    ]);
  });

  it('releases a modifier at the end of a sendKeys call', async () => {
    const { element, keyboardActions } = setup();

    await element.sendKeys(Key.SHIFT, 'a');

    expect(keyboardActions().at(-1)).toStrictEqual({
      type: 'keyUp',
      value: Key.SHIFT,
    });
  });

  it('toggles a repeated modifier off', async () => {
    const { element, keyboardActions } = setup();

    await element.sendKeys(Key.SHIFT, Key.SHIFT, 'a');

    expect(keyboardActions().slice(0, 2)).toStrictEqual([
      { type: 'keyDown', value: Key.SHIFT },
      { type: 'keyUp', value: Key.SHIFT },
    ]);
  });

  it('clears text with select-all and backspace', async () => {
    const { element, keyboardActions } = setup();

    await element.clear();

    expect(keyboardActions()).toContainEqual({
      type: 'keyDown',
      value: Key.BACK_SPACE,
    });
    expect(keyboardActions()).toContainEqual({ type: 'keyDown', value: 'a' });
  });

  it('rejects keyboard input when the element cannot receive focus', async () => {
    const { element } = setup({ focused: false });

    await expect(element.sendKeys('hello')).rejects.toThrow(
      error.ElementNotInteractableError,
    );
  });

  it('preserves invalid-element-state errors for clearing non-editable inputs', async () => {
    const { element } = setup({ focused: 'invalid' });

    await expect(element.clear()).rejects.toThrow(
      error.InvalidElementStateError,
    );
  });

  it.each([
    ['covered', error.ElementClickInterceptedError],
    ['hidden', error.ElementNotInteractableError],
  ])('rejects %s clicks', async (clickTarget, expectedError) => {
    const { element } = setup({ clickTarget });

    await expect(element.click()).rejects.toThrow(expectedError);
  });

  it('uses native pointer actions for an unobstructed click', async () => {
    const { element, execute } = setup({
      failure: new error.JavascriptError(
        "Cannot read properties of undefined (reading 'Aa')",
      ),
    });

    await element.click();

    expect(
      execute.mock.calls.some(
        ([command]) => command.getName() === Name.ACTIONS,
      ),
    ).toBe(true);
  });

  it('uses the containing select for an option click instead of its zero-sized box', async () => {
    const { element, execute } = setup({ isOption: true });

    await element.click();

    const hitTest = execute.mock.calls.find(
      ([command]) =>
        command.getName() === Name.EXECUTE_SCRIPT &&
        String(command.getParameter('script')).includes('scrollIntoView'),
    )?.[0];
    expect(hitTest?.getParameter('args')).toStrictEqual([
      WebElement.buildId('select'),
    ]);
    expect(
      execute.mock.calls.some(
        ([command]) => command.getName() === Name.ACTIONS,
      ),
    ).toBe(false);
  });

  it.each([
    {
      action: 'uploads',
      input: '/tmp/one.json\n/tmp/two.json',
      files: ['/tmp/one.json', '/tmp/two.json'],
    },
    { action: 'clears', input: undefined, files: [] },
  ])('$action files through BiDi', async ({ input, files }) => {
    const { element, bidiSend } = setup({ inputType: 'file' });

    await (input === undefined ? element.clear() : element.sendKeys(input));

    expect(bidiSend).toHaveBeenCalledWith({
      method: 'input.setFiles',
      params: {
        context: 'window',
        element: { sharedId: 'element' },
        files,
      },
    });
  });

  it('surfaces a rejected file upload', async () => {
    const { element, bidiSend } = setup({ inputType: 'file' });
    bidiSend.mockResolvedValueOnce({
      type: 'error',
      error: 'invalid argument',
      message: 'File does not exist',
    });

    await expect(element.sendKeys('/tmp/missing.json')).rejects.toThrow(
      'File does not exist',
    );
  });
});
