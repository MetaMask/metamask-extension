# About Driver

Driver is a custom class designed for handling web automation interactions, serving as a wrapper around the Selenium WebDriver library.

## Driver key features:

- Locator strategy that utilizes the buildLocator function, supporting inline locators as an alternative to the traditional use of Selenium's By abstraction.
- The finding element calls the wrapElementWithAPI method which mirrors the Playwright API, facilitating tool migration.
- A comprehensive suite of methods for element, interacting with them, and performing actions using keyboard and mouse.
- Appropriate waiting strategies for elements to appear within a time period or condition is met.
- Management of browser windows, tabs, alerts, and frames with appropriate navigation, switching, and closing capabilities.
- Validation of the application with assertion statements to check expected values and conditions.
- Error-handling mechanisms to capture and log browser console errors, simplifying the identification and troubleshooting of issues encountered during testing.
- Capture of screenshots during automated testing in the event of failures, aiding in debugging and issue pinpointing.

## Locators

In web automation testing, locators are crucial commands that guide the framework to identify and select [HTML elements](https://www.w3schools.com/html/default.asp) on a webpage for interaction. They play a vital role in executing various actions such as clicking buttons, fill text, or retrieving data from web pages. Gaining a solid understanding of locators is a key step in initiating web testing automation, as they form the foundation for engaging with web elements.

## buildLocator

**`buildLocator`** function enhances element matching capabilities by introducing support for inline locators, offering an alternative to the traditional use of Selenium's By abstraction.

[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L152C3-L152C15)

**Arguments**<br>
@param {string | object} locator - this could be 'css' or 'xpath' and value to use with the locator strategy.

**Returns**<br>
@returns {object} By object that can be used to locate elements.<br>
@throws {Error} Will throw an error if an invalid locator strategy is provided.

<details><summary><b>Locate element by CSS</b></summary>

><br>
> CSS Selectors in Selenium are string patterns used to identify an element based on a combination of HTML tag, id, class, and attributes.
>
>#### **Class - CSS Selector**
>
>---
>
>To locate an element by its class using a CSS selector, prepend the class name with a dot (.) symbol.
>
>![Screenshot displays the send transaction screen of MetaMask, highlighting how to locate the amount text box using its class.](image/classSelector.png)
>
>
>Syntax for locating by Class
>
>```jsx
>await driver.findElement('.unit-input__input’);
>```
>
>#### **ID - CSS selector**
>---
>
>To locate an element by its ID using a CSS selector, prepend the ID with a hash sign (#).
>
>![Screenshot displays the login screen of MetaMask, highlighting how to locate the password text box using its ID.](image/idSelector.png)
>
>Syntax for locating by ID
>
>```tsx
>await driver.findElement('#password');
>```
>
>#### **Attribute - CSS selector**
>---
>
>To target an element based on its attribute using a CSS selector, use square brackets ([]) to specify the attribute name and its value.
>
>![Screenshot displays the overview screen of MetaMask, highlighting how to locate the button ‘Buy & Sell’ using its unique attribute **data-testid and its value**.](image/attributeSelector.png)
>
>Syntax for locating the attribute **data-testid**
>
>```tsx
>await driver.findElement('[data-testid="eth-overview-buy"]');
>```
>
>#### **Attribute and tag - CSS  Selector**
>---
>
>Tag and attribute selectors provide a powerful way to precisely target and style HTML elements based on their type and characteristics.
>
>![Screenshot displays the onboarding - Add custom network screen of MetaMask, highlighting how to locate the input field using the tag name and attribute type text.](image/attributeTagSelector.png)
>
>Syntax for locating the elements of type input text.
>
>```tsx
>await driver.findElements('input[type="text"]')
>```
>
>#### **Locate element by link text**
>---
>This type of CSS locator applies only to hyperlink texts with the anchor tags.
>
>![Screenshot displays the contacts screen of MetaMask, highlighting how to locate the ‘Delete contact’ link using its type as Anchor(a).](image/linkTextSelector.png)
>
>Syntax for locating the links
>
>```tsx
>await driver.findElement({ text: 'Delete contact', tag: 'a' });
>```
>>
</details>
<br>

<details><summary><b>Locate element by XPath</b></summary>

>
>To locate an element by XPath,to navigate through elements and attributes in the HTML document.
>
>![Screenshot displays ‘Confirm’ button in the send transaction page](image/xpath.png)
>
>Syntax for locating the button element that contains text ‘Confirm’
>
>```tsx
>await driver.findClickableElement({ text: 'Confirm', tag: 'button' });
>```
>
>Another syntax for locating the div menu element that contains text ‘Settings’
>
>```tsx
>await driver.clickElement({ text: 'Settings', tag: 'div' });
>```
>>
</details>
<br>

<details><summary><b>**** Note - locators ****</b></summary>

>
>Our team utilizes a custom locator identification syntax consisting of Element Type, Identifier Type, and Identifier Value for efficient. Adherence to this syntax is crucial for maintaining consistency and streamlining our workflow
>
>Selenium syntax for locator declaration
>
>```jsx
>const passwordBox = await findElement(driver, By.css('#password'))
>await passwordBox.sendKeys('password123')
>```
>
>Our framework syntax
>
>```tsx
>await driver.fill('#password', 'password123');
>```
>>
</details>

## Elements

Finding web elements is a fundamental task in web automation and testing, allowing scripts to interact with various components of a web page, such as input fields, buttons, links, and more. One of the element identification methods listed below combines with the use [locators](#locators) to uniquely identify an element on the page.

<details><summary><b>findElement</b></summary>
<br>

>**`findElement`** method is called on the driver instance, it returns a reference to the first element in the DOM that matches with the provided locator. This value can be stored and used for future element actions.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L323)
>
>**Arguments**<br>
>@param {string} rawLocator - element locator
>
>**Returns**<br>
>@return {Promise<WebElement>} A promise that resolves to the WebElement.
>
>**Example - Evaluating entire DOM**
>
>```jsx
>await driver.findElement('[data-testid="account-menu-icon"]');
>```
>
>Example - **Evaluating a subset of the DOM**
>
>```jsx
>await driver.findElement({
>          css: '[data-testid="network-display"]',
>          text: 'Localhost 8545',
>        });
>```
>>
</details>
<br>
<details><summary><b>findElements</b></summary>
<br>

>**`findElements`** method return a collection of element references. If there are no matches, an empty list is returned.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L347)
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator
>
>**Returns**<br>
>@returns {Promise<Array<WebElement>>} A promise that resolves to an array of found elements.
>
>**Example for all matching FindElements**
>
>```jsx
>let assets = await driver.findElements('.multichain-token-list-item');
>```
>
>Example of FindElements with getText()
>
>```jsx
>const warnings = await driver.findElements('.import-srp__banner-alert-text');
>const warning = warnings[1];
>warningText = await warning.getText()
>```
>>
</details>
<br>

<details><summary><b>findVisibleElement</b></summary>
<br>

>**`findVisibleElement`** method is used to track (or) find DOM element which is visible
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L332)
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator
>
>**Returns**<br>
>@return {Promise<WebElement>} A promise that resolves to the WebElement.
>
>**Example for all matching** findVisibleElement
>
>```jsx
>await driver.findVisibleElement(
>          '[data-testid="confirm-delete-network-modal"]',);
>```
>>
</details>
<br>

<details><summary><b>findClickableElement</b></summary>
<br>

>**`findClickableElement`** method is used to track (or) find DOM element which is clickable
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L338)
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator
>
>**Returns**<br>
>@return {Promise<WebElement>} A promise that resolves to the WebElement.
>
>**Example for f**indClickableElement
>
>```jsx
>await driver.findClickableElement('#depositButton');
>```
>>
</details>
<br>
<details><summary><b>findClickableElements</b></summary>
<br>

>**`findClickableElements`** method is used to track (or) find DOM elements which are clickable
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L356)
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator
>
>**Returns**<br>
>@return {Promise<WebElement>} A promise that resolves to the WebElement.
>
>**Example**
>
>```jsx
>const domains = await driver.findClickableElements(
>         '.connected-sites-list__subject-name',
>        );
>assert.equal(domains.length, 1);
>```
>>
</details>

## Interactions
When we talk about interacting with web elements, we mean simulating the actions a user might take on a webpage. This includes:

- **Clicking**: Simulating a mouse click on buttons, links, or any clickable elements.
- **Typing**: Entering text into input fields like text boxes or text areas.
- **Reading**: Extracting text or attributes from web elements to verify content or use it elsewhere.
- **Selecting**: Choosing options from dropdown menus or lists.
- **Scrolling**: Moving through the webpage, either to specific elements or a certain distance up or down.
- **Navigating**: Going through the web pages by clicking on links, using the back or forward buttons, or directly setting the URL.

Each of these actions requires first [locating](#locators) the web element you want to interact with, which is usually done using selectors like IDs, class names, CSS selectors, or XPath expressions.

<details><summary><b>fill</b></summary>
<br>

>**`fill`** method is designed to locate a web element on the page and input a specified text value into it. This method is particularly useful for automating interactions with text fields, such as username or password inputs, search boxes, or any editable text areas within a web application.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L199)
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator
>@param {string} input - The value to fill the element with
>
>**Returns**<br>
>@returns {Promise<WebElement>} Promise resolving to the filled element
>
>**Example**
>
>```jsx
>await driver.fill(
>                'input[data-testid="ens-input"]',
>                '0xc427D562164062a23a5cFf596A4a3208e72Acd28');
>```
>>
</details><br>
<details><summary><b>clickElementSafe</b></summary>
<br>

>**`clickElementSafe`** method is an asynchronous function designed to click on a web element. It is particularly useful in instances where an element requires scrolling, but the scroll button does not appear due to rendering differences. In such cases, the method proceeds to the next step without causing a test failure and logs the action in the console.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L382)
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator
>
>**Returns**<br>
>
>@return {Promise<WebElement>} A promise that resolves to the WebElement.
>
>**Example**
>
>```jsx
>await driver.clickElementSafe('[data-testid="snap-install-scroll"]');
>```
>>
</details><br>
<details><summary><b>clickElement</b></summary>
<br>

>**`clickElement`** method is an asynchronous function that aims to simulate a click action on a specified web element within a web page. This method is commonly used to interact with clickable elements such as buttons, links, checkboxes, or any other elements that respond to click events.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L370)
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator
>
>**Return**<br>
>@returns {Promise} A promise that will be fulfilled when the click command has completed.
>
>**Example**
>
>```jsx
>const nextPageButton = '[data-testid="page-container-footer-next"]',
>await driver.clickElement(nextPageButton);
>```
>>
</details><br>
<details><summary><b>press</b></summary>
<br>

>**`press`** method enables the simulation of keyboard actions on a specified web element. This can include typing characters into a text field, activating keyboard shortcuts, or any other keyboard-related interactions within a web page.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L205)
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator
>@param {string} keys - The key to press.
>
>**Return**<br>
> @returns {Promise<WebElement>} promise resolving to the filled element
>**Example**
>
>```jsx
>const ENTER = '\uE007',
>await driver.press('#password', ENTER);
>```
>
>Other key actions
>
>```
>this.Key = {
>      BACK_SPACE: '\uE003',
>      ENTER: '\uE007',
>      SPACE: '\uE00D',
>      CONTROL: '\uE009',
>      COMMAND: '\uE03D',
>      MODIFIER: process.platform === 'darwin' ? Key.COMMAND : Key.CONTROL,
>    };
>```
>>
</details><br>
<details><summary><b>getText</b></summary>
<br>

>**`getText`** method in Selenium is used to retrieve the visible text of a web element.
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator
>
>**Returns**<br>
>@returns {text} String
>
>**Example**
>
>```jsx
>const pageTitle = await driver.findElement('.unlock-page__title');
>assert.equal(await pageTitle.getText(), 'Welcome back!');
>```
>>
</details>

## Waits

Selenium provides several mechanisms for managing waits, crucial for handling the asynchronous nature of web applications where elements may load at different times. These waits help avoid errors in test scripts that occur when trying to interact with elements that are not yet available on the web page

## When do we need to wait?

- **Before Locating the Element:**
    - Ensure that the page or relevant components have fully loaded.
    - You can use explicit waits to wait for certain conditions, like the visibility of an element or the presence of an element in the DOM.
- **CSS Selector and Element Existence:**
    - Ensure that the CSS selector is correct and that the element you're trying to locate actually exists in the DOM at the time you're trying to find it.
    - It's possible the element is dynamically loaded or changed due to a recent update in the application.
- **Context Switching:**
    - Consider switching the context to that iframe or modal before attempting to locate the element.
- **Recent Changes:**
    - If the issue started occurring recently, review any changes made to the application that could affect the visibility or availability of the element.
- **Timeout Period:**
    - If the default timeout is too short for the page or element to load, consider increasing the timeout period. This is especially useful for pages that take longer to load due to network latency or heavy JavaScript use.

This organization helps provide a clear structure for understanding the various situations in which waiting may be necessary when working with web elements.

<details><summary><b>wait</b></summary>
<br>

>**`wait`** method is an asynchronous function to wait for a specific condition to be met within a given timeout period, with an option to catch and handle any errors that occur during the wait.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L215)
>
>**Arguments**<br>
>@param {Function} condition - Function or a condition that the method waits to be fulfilled or to return true.<br>
>@param {number} timeout - Optional parameter specifies the maximum milliseconds to wait.<br>
>@param catchError - Optional parameter that determines whether errors during the wait should be caught and handled within the method
>
>**Returns**<br>
>@returns {Promise} A promise that will be fulfilled after the specified number of milliseconds.<br>
>@throws {Error} Will throw an error if the condition is not met within the timeout period.
>
>**Example wait until a condition occurs**
>
>```jsx
>await driver.wait(async () => {
>  info = await getBackupJson();
>  return info !== null;
>}, 10000);
>```
>
>**Example wait until the condition for finding the elements is met and ensuring that the length validation is also satisfied.**
>
>```jsx
>await driver.wait(async () => {
>        const confirmedTxes = await driver.findElements(
>          '.transaction-list__completed-transactions .transaction-list-item',
>        );
>        return confirmedTxes.length === 1;
>      }, 10000);
>```
>
>**Example wait until a mock condition occurs**
>
>```jsx
>
>await driver.wait(async () => {
>      const isPending = await mockedEndpoint.isPending();
>      return isPending === false;
>     }, 3000);
>```
>>
</details><br>
<details><summary><b>waitForSelector</b></summary>
<br>

>**`waitForSelector`** method allows for flexible handling of element visibility and detachment from the DOM, making it useful for ensuring that web interactions occur only when the page is in the desired state. This method can be used in scenarios where you need to wait for an element to appear or disappear before performing further actions, such as:
>
>- Ensuring a modal dialog is visible before attempting to close it.
>- Verifying that an item has been removed from the page after a delete action.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L227)
>
>**Arguments**
>
>@param {string | object} rawLocator - Element locator<br>
>@param {number} timeout - optional parameter that specifies the maximum amount of time (in milliseconds) to wait for the condition to be met and desired state of the element to wait for.<br>
>It defaults to 'visible', indicating that the method will wait until the element is visible on the page.<br>
>The other supported state is 'detached', which means waiting until the element is removed from the DOM.
>
>**Returns**<br>
>@returns {Promise} A promise that will be fulfilled when the element reaches the specified state or the timeout expires.<br>
>@throws {Error} Will throw an error if the element does not reach the specified state within the timeout period.
>
>**Example** wait for element to load
>
>```jsx
>await driver.waitForSelector('.import-srp__actions');
>```
>>
</details><br>
<details><summary><b>waitForNonEmptyElement</b></summary>
<br>

>**`waitForNonEmptyElement`** method is an asynchronous function designed to wait until a specified web element contains some text, i.e., it's not empty. This can be particularly useful in scenarios where the content of an element is dynamically loaded or updated, and you need to ensure the element has content before proceeding with further actions. This method is useful when you need to wait for a message, label, or any piece of information to appear in a UI element before performing further actions, such as:
>
>- Waiting for a success message after submitting a form.
>- Ensuring that a dynamically loaded piece of text, like a user's name or a search result, is displayed before proceeding.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L253)
>
>**Arguments**<br>
>@param {string | object} element - Element locator
>
>**Returns**<br>
>@returns {Promise} A promise that will be fulfilled when the element becomes non-empty or the timeout expires.<br>
>@throws {Error} Will throw an error if the element does not become non-empty within the timeout period.
>
>**Example**
>
>```jsx
>const revealedSeedPhrase = await driver.findElement(
>          '.reveal-seed-phrase__secret-words',
>        );
>await driver.waitForNonEmptyElement(revealedSeedPhrase)
>```
>>
</details><br>
<details><summary><b>waitForElementState</b></summary>
<br>

>**`waitForElementState`** method waits for a specific state of an element.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L54)
>
>**Arguments**<br>
>@param {WebElement} element - Element locator<br>
>@param {string} state - state to wait for could be 'visible', 'hidden', 'enabled', 'disabled'
>@param {number} [timeout=5000] - amount of time in milliseconds to wait before timing out
>
>**Returns**<br>
>@returns {Promise<void>} A promise that resolves when the element is in the specified state. <br>
>@throws {Error} Will throw an error if the element does not reach the specified state within the timeout period.
>
>**Example**
>
>```jsx
>const networkSelectionModal = await driver.findVisibleElement(
>          '.mm-modal',);
>// Wait for network to change and token list to load from state
>await networkSelectionModal.waitForElementState('hidden');
>```
>>
</details><br>

## assertElementNotPresent

## **** NOTE - No Delay ****

**`delay`** method is hard-coded wait may be longer than needed, resulting in slower test execution. Please avoid using this method.

## Actions

These interactions include keyboard and mouse actions.

### Keyboard
---

Selenium can simulate keyboard shortcuts by sending combinations of keys.


<details><summary><b>sendKeys</b></summary>
<br>

```jsx
const approveInput = await driver.findElement('#approveTokenInput');
await approveInput.sendKeys('1');
```
</details>

<details><summary><b>clear</b></summary>
<br>

```jsx
const approveInput = await driver.findElement('#approveTokenInput');
await approveInput.clear();
```
</details>

<details><summary><b>pasteIntoField</b></summary>
<br>

>**`pasteIntoField`** function simulates the pasting of content into a specified field, employing a unique approach to managing the clipboard.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L465)
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator
>
>@param {string} contentToPaste -  content to paste.
>
>**Returns**<br>
>@return {Promise<WebElement>} A promise that resolves to the WebElement.
>
>**Example**
>
>```jsx
>await driver.pasteIntoField('#bip44Message', '1234');
>```
>>
</details>

### Mouse
---

A representation of any pointer device for interacting with a web page.

<details><summary><b>clickElementUsingMouseMove</b></summary>
<br>

>**`clickElementUsingMouseMove`** function by simulating a more natural mouse movement towards the element before initiating a click. This is essential for web pages with buttons that only respond correctly to user interactions when the mouse physically moves to the button before clicking, as opposed to executing a direct click command.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L403)
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator
>
>**Returns**<br>
>@returns {Promise} A promise that will be fulfilled when the click command has completed.
>
>**Example**
>
>```jsx
>await driver.clickElementUsingMouseMove({
>      text: 'Reject request',
>      tag: 'div',
>    });
>```
>>
</details>

<details><summary><b>scrollToElement</b></summary>
<br>

>**`scrollToElement`** function scrolls the web page until the specified element comes into view.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L434)
>
>**Arguments**<br>
>@param {string | object} element - The web element to scroll to.
>
>**Returns**<br>
>@returns {Promise} A promise that will be fulfilled when the scroll has completed.
>
>**Example**
>
>```jsx
>const removeButton = await driver.findElement(
>          '[data-testid="remove-snap-button"]',
>        );
>await driver.scrollToElement(removeButton);
>await driver.clickElement('[data-testid="remove-snap-button"]');
>```
>>
</details>

<details><summary><b>holdMouseDownOnElement</b></summary>
<br>

>**`holdMouseDownOnElement`** function simulates the action of pressing and holding down the mouse button on a specific element for a specified duration.
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L422)
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator<br>
>@param {int} ms - duration (in milliseconds) for which the mouse button should be held down on the element.
>
>**Returns**<br>
>@returns {Promise} A promise that will be fulfilled when the mouse down command has completed.
>
>**Example**
>
>```jsx
>await driver.holdMouseDownOnElement(
>      {
>        text: tEn('holdToRevealPrivateKey'),
>        tag: 'span',
>      },
>      2000,
>    );
>```
>>
</details>

<details><summary><b>clickPoint</b></summary>
<br>

>**`clickPoint`** function is designed to click on a specific point, determined by the x and y coordinates
>
>[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L413)
>
>**Arguments**<br>
>@param {string | object} rawLocator - Element locator<br>
>@param {number} x - The x coordinate to click at.<br>
>@param {number} y - The y coordinate to click at.<br>
>
>**Returns**<br>
>@returns {Promise} A promise that will be fulfilled when the click command has completed.
>>
</details>