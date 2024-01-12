import { type BrowserContext, type Page, expect } from '@playwright/test';

export const generateAccounts = () => {
  const alpha = Array.from(Array(10)).map((_, i) => i + 65);
  const alphabet = alpha.map(
    (x) => `Custody Account ${String.fromCharCode(x)}`,
  );

  return alphabet;
};

export async function checkLinkURL(
  context: BrowserContext,
  page: Page,
  textToSearch: string,
  URLlink: string,
  role: 'link' | 'button' = 'link',
) {
  function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  }
  const links = await page.getByRole(role, { name: textToSearch }).all();
  for (const link of links) {
    const pagePromise = context.waitForEvent('page');
    await link.click();
    const newPage = await pagePromise;
    const regex = new RegExp(`.*${escapeRegExp(URLlink)}.*`, 'iu');
    await expect.soft(newPage).toHaveURL(regex);
    console.log(`click in ${textToSearch} and opening page ${newPage.url()}`);
    await newPage.close();
  }
}

export async function closePages(
  context: BrowserContext,
  URLpatterns: string[],
) {
  const pages = context.pages();
  for (const page of pages) {
    const url = page.url();
    for (const pattern of URLpatterns) {
      if (url.includes(pattern)) {
        await page.close();
        break;
      }
    }
  }
}

// It returns the page in the pattern and close the others that follow the same pattern
export async function getPageAndCloseRepeated(
  context: BrowserContext,
  URLpattern: string,
): Promise<Page> {
  let pageFound;
  const pages = context.pages();
  for (const page of pages) {
    const url = page.url();
    if (url.includes(URLpattern)) {
      if (pageFound) {
        page.close();
      } else {
        pageFound = page;
      }
    }
  }
  if (pageFound) {
    return pageFound;
  }
  throw Error(`Page pattern ${URLpattern} not found`);
}
