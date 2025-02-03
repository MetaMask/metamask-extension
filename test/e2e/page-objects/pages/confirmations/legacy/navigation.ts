import { Driver } from '../../../../webdriver/driver';

class ConfirmationNavigation {
  private driver: Driver;

  private nextPageButton: string;

  private previousPageButton: string;

  private firstPageButton: string;

  private lastPageButton: string;

  private navigationTitle: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.nextPageButton = '[data-testid="next-page"]';
    this.previousPageButton = '[data-testid="previous-page"]';
    this.firstPageButton = '[data-testid="first-page"]';
    this.lastPageButton = '[data-testid="last-page"]';
    this.navigationTitle = '.confirm-page-container-navigation';
  }

  async clickNextPage(): Promise<void> {
    await this.driver.clickElement(this.nextPageButton);
  }

  async clickPreviousPage(): Promise<void> {
    await this.driver.clickElement(this.previousPageButton);
  }

  async clickFirstPage(): Promise<void> {
    await this.driver.clickElement(this.firstPageButton);
  }

  async clickLastPage(): Promise<void> {
    await this.driver.clickElement(this.lastPageButton);
  }

  async check_pageNumbers(
    currentPage: number,
    totalPages: number,
  ): Promise<void> {
    try {
      await this.driver.findElement({
        css: this.navigationTitle,
        text: `${currentPage} of ${totalPages}`,
      });
    } catch (e) {
      console.log('Timeout while waiting for navigation page numbers', e);
      throw e;
    }
  }
}

export default ConfirmationNavigation;
