import React from 'react';
import {
  settingsRoutes,
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from './settings-search';

describe('Settings Search Utils', () => {
  describe('settingsRoutes', () => {
    it('should be an array of settings routes objects', () => {
      expect(settingsRoutes.length).toBeGreaterThan(0);
    });
  });

  describe('getNumberOfSettingsInSection', () => {
    it('should get good general section number', () => {
      expect(getNumberOfSettingsInSection('general')).toStrictEqual(5);
    });

    it('should get good advanced section number', () => {
      expect(getNumberOfSettingsInSection('advanced')).toStrictEqual(13);
    });

    it('should get good contact section number', () => {
      expect(getNumberOfSettingsInSection('contacts')).toStrictEqual(1);
    });

    it('should get good security & privacy section number', () => {
      expect(getNumberOfSettingsInSection('securityAndPrivacy')).toStrictEqual(
        4,
      );
    });

    it('should get good alerts section number', () => {
      expect(getNumberOfSettingsInSection('alerts')).toStrictEqual(2);
    });

    it('should get good network section number', () => {
      expect(getNumberOfSettingsInSection('networks')).toStrictEqual(6);
    });

    it('should get good experimental section number', () => {
      expect(getNumberOfSettingsInSection('experimental')).toStrictEqual(2);
    });

    it('should get good about section number', () => {
      expect(getNumberOfSettingsInSection('about')).toStrictEqual(8);
    });
  });

  // Can't be tested without DOM element
  describe('handleSettingsRefs', () => {
    it('should handle general refs', () => {
      const settingsRefs = Array(getNumberOfSettingsInSection('general'))
        .fill(undefined)
        .map(() => {
          return React.createRef();
        });
      expect(handleSettingsRefs('general', settingsRefs)).toBeUndefined();
    });
  });
});
