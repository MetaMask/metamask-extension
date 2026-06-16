import React, { Component, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getMessage } from '../ui/helpers/utils/i18n-helper';
import { I18nContext } from '../ui/contexts/i18n';

export { I18nContext };

export const I18nProvider = ({
  currentLocale,
  current,
  en,
  children,
} = {}) => {
  const t = useMemo(() => {
    return (key, ...args) =>
      getMessage(currentLocale, current, key, ...args) ||
      getMessage(currentLocale, en, key, ...args);
  }, [currentLocale, current, en]);

  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
};

I18nProvider.propTypes = {
  currentLocale: PropTypes.string,
  current: PropTypes.object,
  en: PropTypes.object,
  children: PropTypes.node,
};

export class LegacyI18nProvider extends Component {
  static propTypes = {
    children: PropTypes.node,
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
