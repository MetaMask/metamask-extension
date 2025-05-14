import { Driver } from '../../../webdriver/driver';

class ContactsSettings {
  private readonly driver: Driver;

  private readonly contactsSettingsPageTitle = {
    text: 'Contacts',
    tag: 'h4',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.contactsSettingsPageTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for Contacts Settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Contacts Settings page is loaded');
  }
}

export default ContactsSettings;
