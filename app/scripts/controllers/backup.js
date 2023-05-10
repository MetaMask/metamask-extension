import { merge } from 'lodash';
import { prependZero } from '../../../shared/modules/string-utils';

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

  /*
   * YYYY_MM_DD_HH_mm_SS e.g 2022_01_13_13_45_56
   * */
  getTimestamp(date = new Date()) {
    const prefixZero = (num) => prependZero(num, 2);

    const timestamp = `${date.getFullYear()}-${prefixZero(
      date.getMonth() + 1,
    )}-${prefixZero(date.getDay())} ${prefixZero(date.getHours())}:${prefixZero(
      date.getMinutes(),
    )}:${prefixZero(date.getDay())}`;

    return timestamp;
  }

  async exportContactList() {
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

    const keysToDelete = ['isEns', 'addressType'];
    deleteKeys(contactList, keysToDelete);

    const timestamp = this.getTimestamp()
      .replaceAll(':', '_')
      .replaceAll('-', '_')
      .replaceAll(' ', '_');

    return {
      fileName: `MetaMask_contact_list_${timestamp}.json`,
      data: JSON.stringify(contactList, null, 2),
    };
  }

  async importContactList(jsonString, fileName) {
    const newState = JSON.parse(jsonString);
    console.log({ jsonString, newState });

    function addSourceToEntries(obj, source) {
      for (let chainId in obj) {
          for (let address in obj[chainId]) {
              obj[chainId][address].source = source;
          }
      }
      return obj;
    }

    const timestamp = this.getTimestamp();

    const newStateWithSource = addSourceToEntries(
      newState,
      `Bulk imported from file '${fileName}' on ${timestamp}.`,
    );

    if (newStateWithSource) {
      const previousState = this.addressBookController.state.addressBook;
      const mergedState = merge({}, previousState, newStateWithSource);

      // overwrite on `update` only does shallow merge
      this.addressBookController.update({ addressBook: mergedState }, false);
    }

    if (newStateWithSource) {
      this._trackMetaMetricsEvent({
        event: 'Contact list imported',
        category: 'Backup',
      });
    }
  }

  async clearContactList() {
    this.addressBookController.update(
      {
        addressBook: {},
      },
      true,
    );

    this._trackMetaMetricsEvent({
      event: 'Contact list cleared',
      category: 'Backup',
    });
  }
}
