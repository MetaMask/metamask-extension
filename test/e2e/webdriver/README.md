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
</details>

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