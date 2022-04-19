import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { highlightSearchedText } from '../../../helpers/utils/settings-search';
import { I18nContext } from '../../../contexts/i18n';
import IconCaretRight from '../../../components/ui/icon/icon-caret-right';

export default function SettingsSearchList({ results, onClickSetting }) {
  const t = useContext(I18nContext);

  useEffect(highlightSearchedText, [results]);

  return (
    <div className="settings-page__header__search__list">
      {results.slice(0, 5).map((result) => {
        const { icon, tabMessage, sectionMessage, route } = result;
        return (
          Boolean(icon || tabMessage || sectionMessage) && (
            <div key={`settings_${route}`}>
              <div
                className="settings-page__header__search__list__item"
                onClick={() => onClickSetting(result)}
              >
                <i
                  className={classnames(
                    'settings-page__header__search__list__item__icon',
                    icon,
                  )}
                />

                <span
                  id={`menu-tab_${route}`}
                  className={classnames(
                    'settings-page__header__search__list__item__tab',
                    {
                      'settings-page__header__search__list__item__tab-multiple-lines':
                        tabMessage(t) === t('securityAndPrivacy'),
                    },
                  )}
                >
                  {tabMessage(t)}
                </span>
                <IconCaretRight
                  size={16}
                  className="settings-page__header__search__list__item__caret"
                />
                <span
                  id={`menu-section_${route}`}
                  className={classnames(
                    'settings-page__header__search__list__item__section',
                    {
                      'settings-page__header__search__list__item__section-multiple-lines':
                        tabMessage(t) === t('securityAndPrivacy') ||
                        tabMessage(t) === t('alerts'),
                    },
                  )}
                >
                  {sectionMessage(t)}
                </span>
              </div>
            </div>
          )
        );
      })}
      {results.length === 0 && (
        <div
          className="settings-page__header__search__list__item"
          style={{ cursor: 'auto', display: 'flex' }}
        >
          <span className="settings-page__header__search__list__item__no-matching">
            {t('settingsSearchMatchingNotFound')}
          </span>
        </div>
      )}
      <div
        className="settings-page__header__search__list__item"
        style={{ cursor: 'auto', display: 'flex' }}
      >
        <span className="settings-page__header__search__list__item__request">
          {t('missingSetting')}
        </span>
        <a
          href="https://community.metamask.io/c/feature-requests-ideas/13"
          target="_blank"
          rel="noopener noreferrer"
          key="need-help-link"
          className="settings-page__header__search__list__item__link"
        >
          {t('missingSettingRequest')}
        </a>
      </div>
    </div>
  );
}

SettingsSearchList.propTypes = {
  results: PropTypes.array,
  onClickSetting: PropTypes.func,
};
