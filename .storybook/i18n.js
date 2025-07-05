import React, { Component, createContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getMessage } from '../shared/modules/i18n';
import { I18nContext } from '../ui/contexts/i18n';

export { I18nContext };

export const I18nProvider = (props) => {
  const { currentLocale, current, en } = props;

  const t = useMemo(() => {
    return (key, ...args) => {
      // Ensure we have valid locale data
      const safeCurrentLocale = currentLocale || 'en';
      const safeCurrent = current || {};
      const safeEn = en || {};

      try {
        const result = getMessage(safeCurrentLocale, safeCurrent, key, ...args) ||
                      getMessage(safeCurrentLocale, safeEn, key, ...args);

        // If getMessage returns null or undefined, return a fallback
        if (result === null || result === undefined) {
          return `[${key}]`;
        }

        return result;
      } catch (error) {
        console.warn(`Translation error for key "${key}":`, error);
        return `[${key}]`;
      }
    };
  }, [currentLocale, current, en]);

  return (
    <I18nContext.Provider value={t}>{props.children}</I18nContext.Provider>
  );
};

I18nProvider.propTypes = {
  currentLocale: PropTypes.string,
  current: PropTypes.object,
  en: PropTypes.object,
  children: PropTypes.node,
};

I18nProvider.defaultProps = {
  children: undefined,
};

export class LegacyI18nProvider extends Component {
  static propTypes = {
    children: PropTypes.node,
  };

  static defaultProps = {
    children: undefined,
  };

  static contextType = I18nContext;

  static childContextTypes = {
    t: PropTypes.func,
  };

  getChildContext() {
    return {
      t: this.context,
    };
  }

  render() {
    return this.props.children;
  }
}
