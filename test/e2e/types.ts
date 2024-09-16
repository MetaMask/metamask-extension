import type { Driver } from './webdriver/driver';

/**
 * Locator is a type that can be used to locate an element in the DOM
 * It is passed to {@link Driver.buildLocator} to generate a Selenium locator.
 */
export type Locator =
  | string // css selector
  | { value: any }
  | { xpath: string }
  | {
      text: string;
      css?: string;
      tag?: string;
    };
