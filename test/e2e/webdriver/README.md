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

## Locate e**lement by XPath**


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