# About Driver

Driver is a custom class designed for handling web automation interactions, serving as a wrapper around the Selenium WebDriver library.

## Driver key features:

- Locator strategy that utilizes the buildLocator function, supporting inline locators as an alternative to the traditional use of Selenium's By abstraction.
- The wrapElementWithAPI method mirrors the Playwright API, facilitating tool migration.
- A comprehensive suite of methods for finding elements, interacting with them, and performing actions using keyboard and mouse.
- Appropriate waiting strategies for elements to appear.
- Management of browser windows, tabs, alerts, and frames with appropriate navigation, switching, and closing capabilities.
- Validation of the application with assertion statements to check expected values and conditions.
- Error-handling mechanisms to capture and log browser console errors, simplifying the identification and troubleshooting of issues encountered during testing.
- Capture of screenshots during automated testing in the event of failures, aiding in debugging and issue pinpointing.

## Locators

In web automation testing, locators are crucial commands that guide the framework to identify and select [HTML elements](https://www.w3schools.com/html/default.asp) on a webpage for interaction. They play a vital role in executing various actions such as clicking buttons, fill text, or retrieving data from web pages. Gaining a solid understanding of locators is a key step in initiating web testing automation, as they form the foundation for engaging with web elements.

## buildLocator

**`buildLocator`**function enhances element matching capabilities by introducing support for inline locators, offering an alternative to the traditional use of Selenium's By abstraction.

[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L152C3-L152C15)

**Arguments**

@param {string | object} locator - this could be 'css' or 'xpath' and value to use with the locator strategy.

**Returns**

@returns {object} By object that can be used to locate elements.

@throws {Error} Will throw an error if an invalid locator strategy is provided.

<details><summary><b>Read more about locating elements</b></summary>
<br/>

## Locate element by CSS

CSS Selectors in Selenium are string patterns used to identify an element based on a combination of HTML tag, id, class, and attributes.

### **Class - CSS Selector**

---

To locate an element by its class using a CSS selector, prepend the class name with a dot (.) symbol.

![Screenshot displays the send transaction screen of MetaMask, highlighting how to locate the amount text box using its class.](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/image/classSelector.png)

Screenshot displays the send transaction screen of MetaMask, highlighting how to locate the amount text box using its class.

Syntax for locating by Class

```jsx
await driver.findElement('.unit-input__input’);
```

### **ID - CSS selector**
---

To locate an element by its ID using a CSS selector, prepend the ID with a hash sign (#).

![Screenshot displays the login screen of MetaMask, highlighting how to locate the password text box using its ID.](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/image/idSelector.png)

Screenshot displays the login screen of MetaMask, highlighting how to locate the password text box using its ID.

Syntax for locating by ID

```tsx
await driver.findElement('#password');
```

### **Attribute - CSS selector**

---

To target an element based on its attribute using a CSS selector, use square brackets ([]) to specify the attribute name and its value.

![Screenshot displays the overview screen of MetaMask, highlighting how to locate the button ‘Buy & Sell’ using its unique attribute **data-testid and its value**.](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/image/attributeSelector.png)

Screenshot displays the overview screen of MetaMask, highlighting how to locate the button ‘Buy & Sell’ using its unique attribute **data-testid and its value**.

Syntax for locating the attribute **data-testid**

```tsx
await driver.findElement('[data-testid="eth-overview-buy"]');
```

### **Attribute and tag - CSS  Selector**

---

Tag and attribute selectors provide a powerful way to precisely target and style HTML elements based on their type and characteristics.

![Screenshot displays the onboarding - Add custom network screen of MetaMask, highlighting how to locate the input field using the tag name and attribute type text.](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/imageattributeTagSelector.png)

Screenshot displays the onboarding - Add custom network screen of MetaMask, highlighting how to locate the input field using the tag name and attribute type text.

Syntax for locating the elements of type input text.

```tsx
await driver.findElements('input[type="text"]')
```

## **Locate element by link text**

This type of CSS locator applies only to hyperlink texts with the anchor tags.

![Screenshot displays the contacts screen of MetaMask, highlighting how to locate the ‘Delete contact’ link using its type as Anchor(a).](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/linkTextSelector.png)

Screenshot displays the contacts screen of MetaMask, highlighting how to locate the ‘Delete contact’ link using its type as Anchor(a).

Syntax for locating the links

```tsx
await driver.findElement({ text: 'Delete contact', tag: 'a' });
```

## **Locate element by XPath**


To locate an element by XPath, use a path expression to navigate through elements and attributes in the HTML document.

![Screenshot displays the contacts screen of MetaMask, highlighting how to locate the ‘Delete contact’ link using its type as Anchor(a).](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/xpath.png)

Screenshot displays the contacts screen of MetaMask, highlighting how to locate the ‘Delete contact’ link using its type as Anchor(a).

Syntax for locating the button element that contains text ‘Confirm’

```tsx
await driver.findClickableElement({ text: 'Confirm', tag: 'button' });
```

Another syntax for locating the div menu element that contains text ‘Settings’

```tsx
await driver.clickElement({ text: 'Settings', tag: 'div' });
```

# **** Note - locators ****

Our team utilizes a custom locator identification syntax consisting of Element Type, Identifier Type, and Identifier Value for efficient. Adherence to this syntax is crucial for maintaining consistency and streamlining our workflow

Selenium syntax for locator declaration

```jsx
const passwordBox = await findElement(driver, By.css('#password'))
await passwordBox.sendKeys('password123')
```

Our framework syntax

```tsx
await driver.fill('#password', 'password123');
```

</details>

## Elements

## Finding web elements

Finding web elements is a fundamental task in web automation and testing, allowing scripts to interact with various components of a web page, such as input fields, buttons, links, and more. One of the element identification methods listed below combines with the use [locators](#locators) to uniquely identify an element on the page.

<b>[findElement](#findelement)</br>
<b>[findElements](#findelements)</br>
<b>[findVisibleElement](#findVisibleElement)</br>
<b>[findClickableElement](#findClickableElement)</br>
<b>[findClickableElements](#findClickableElements)</br>

## **findElement**

**`findElement`** method is called on the driver instance, it returns a reference to the first element in the DOM that matches with the provided locator. This value can be stored and used for future element actions.

[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L323)

**Arguments**

@param {string} rawLocator - element locator

**Returns**

@return {Promise<WebElement>} A promise that resolves to the WebElement.

**Example - Evaluating entire DOM**

```jsx
await driver.findElement('[data-testid="account-menu-icon"]');
```

Example - **Evaluating a subset of the DOM**

```jsx
await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Localhost 8545',
        });
```

## **findElements**


**`findElements`** method return a collection of element references. If there are no matches, an empty list is returned.

[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L347)

**Arguments**

@param {string} rawLocator - element locator

**Returns**

@returns elements.map((element)

**Example for all matching FindElements**

```jsx
let assets = await driver.findElements('.multichain-token-list-item');
```

Example of FindElements with getText()

```jsx
const warnings = await driver.findElements('.import-srp__banner-alert-text');
const warning = warnings[1];
warningText = await warning.getText()
```

## **findVisibleElement**

**`findVisibleElement`** method is used to track (or) find DOM element which is visible

[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L332)

**Arguments**

@param {string} rawLocator - element locator

**Returns**

@return {Promise<WebElement>} A promise that resolves to the WebElement.

**Example for all matching** findVisibleElement

```jsx
await driver.findVisibleElement(
          '[data-testid="confirm-delete-network-modal"]',);
```

## findClickableElement

**`findClickableElement`** method is used to track (or) find DOM element which is clickable

[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L338)

**Arguments**

rawLocator - Element locator

**Returns**

@return {Promise<WebElement>} A promise that resolves to the WebElement.

**Example for f**indClickableElement

```jsx
await driver.findClickableElement('#depositButton');
```

## findClickableElements

**`findClickableElements`** method is used to track (or) find DOM elements which are clickable

[source](https://github.com/MetaMask/metamask-extension/blob/develop/test/e2e/webdriver/driver.js#L356)

**Arguments**

rawLocator - Element locator

**Returns**

@return {Promise<WebElement>} A promise that resolves to the WebElement.

**Example**

```jsx
const domains = await driver.findClickableElements(
          '.connected-sites-list__subject-name',
        );
assert.equal(domains.length, 1);
```