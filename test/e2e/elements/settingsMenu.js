class SettingsMenu {
  constructor(driver) {
    this.driver = driver;
    this.btnGeneral = { text: 'General' };
    this.btnAdvanced = { text: 'Advanced' };
    this.btnContacts = { text: 'Contacts' };
    this.btnSecurityPrivacy = { text: 'Security & Privacy' };
    this.btnAlerts = { text: 'Alerts' };
    this.btnNetworks = { text: 'Networks' };
    this.btnExperimental = { text: 'Experimental' };
    this.btnAbout = { text: 'About' };
  }

  async goToGeneral() {
    await this.driver.clickElement(this.btnGeneral);
  }

  async goToAdvanced() {
    await this.driver.clickElement(this.btnAdvanced);
  }

  async goToContacts() {
    await this.driver.clickElement(this.btnContacts);
  }
}

module.exports = SettingsMenu;
