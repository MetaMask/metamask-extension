import { prependZero } from '../../../shared/modules/string-utils';

const UPDATE_STRATEGY = Object.freeze({
  MERGE: false,
  OVERWRITE: true,
});
export default class BackupController {
  constructor(opts = {}) {
    const {
      preferencesController,
      addressBookController,
      networkController,
      trackMetaMetricsEvent,
    } = opts;

    this.preferencesController = preferencesController;
    this.addressBookController = addressBookController;
    this.networkController = networkController;
    this._trackMetaMetricsEvent = trackMetaMetricsEvent;
  }

  async restoreUserData(jsonString) {
    const existingPreferences = this.preferencesController.store.getState();
    const { preferences, addressBook, network } = JSON.parse(jsonString);
    if (preferences) {
      preferences.identities = existingPreferences.identities;
      preferences.lostIdentities = existingPreferences.lostIdentities;
      preferences.selectedAddress = existingPreferences.selectedAddress;

      this.preferencesController.store.updateState(preferences);
    }

    if (addressBook) {
      this.addressBookController.update(addressBook, true);
    }

    if (network) {
      this.networkController.store.updateState(network);
    }

    if (preferences || addressBook || network) {
      this._trackMetaMetricsEvent({
        event: 'User Data Imported',
        category: 'Backup',
      });
    }
  }

  async backupUserData() {
    const userData = {
      preferences: { ...this.preferencesController.store.getState() },
      addressBook: { ...this.addressBookController.state },
      network: {
        networkConfigurations:
          this.networkController.store.getState().networkConfigurations,
      },
    };

    /**
     * We can remove these properties since we will won't be restoring identities from backup
     */
    delete userData.preferences.identities;
    delete userData.preferences.lostIdentities;
    delete userData.preferences.selectedAddress;

    const result = JSON.stringify(userData);

    const date = new Date();

    const prefixZero = (num) => prependZero(num, 2);

    /*
     * userData.YYYY_MM_DD_HH_mm_SS e.g userData.2022_01_13_13_45_56
     * */
    const userDataFileName = `MetaMaskUserData.${date.getFullYear()}_${prefixZero(
      date.getMonth() + 1,
    )}_${prefixZero(date.getDay())}_${prefixZero(date.getHours())}_${prefixZero(
      date.getMinutes(),
    )}_${prefixZero(date.getDay())}.json`;

    return { fileName: userDataFileName, data: result };
  }

  async exportContactList() {
    /*
    * YYYY_MM_DD_HH_mm_SS e.g 2022_01_13_13_45_56
    * */
    const date = new Date();
    const prefixZero = (num) => prependZero(num, 2);

    const timestamp = `${date.getFullYear()}_${prefixZero(
      date.getMonth() + 1,
    )}_${prefixZero(date.getDay())}_${prefixZero(date.getHours())}_${prefixZero(
      date.getMinutes(),
    )}_${prefixZero(date.getDay())}`;

    const contactList = { ...this.addressBookController.state }.addressBook

    function deleteKeys(obj, keysToDelete) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object') {
            deleteKeys(obj[key], keysToDelete);
          } else if (keysToDelete.includes(key)) {
            delete obj[key];
          }
        }
      }
    }

    const keysToDelete = ['isEns', 'addressType', 'source'];
    deleteKeys(contactList, keysToDelete);

    return {
      fileName: `MetaMask_contact_list_${timestamp}.json`,
      data: JSON.stringify(contactList, null, 2),
    };
  }

  async importContactList(jsonString) {
    const addressBook = JSON.parse(jsonString);

    if (addressBook) {
      this.addressBookController.update({ addressBook }, UPDATE_STRATEGY.MERGE);
    }

    if (addressBook) {
      this._trackMetaMetricsEvent({
        event: 'Contact list imported',
        category: 'Backup',
      });
    }
  }

  async clearContactList() {
    console.log('clearContactList on backup.js');
    this.addressBookController.update(
      {
        addressBook: {},
      },
      UPDATE_STRATEGY.OVERWRITE,
    );

    this._trackMetaMetricsEvent({
      event: 'Contact list cleared',
      category: 'Backup',
    });
  }
}
