import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { highlightSearchedText } from '../../../helpers/utils/settings-search';

export default class SettingsSearchList extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    results: PropTypes.array,
    onClickSetting: PropTypes.func,
  };

  componentDidMount() {
    this.props.results.forEach((_, i) => {
      highlightSearchedText(i);
    });
  }

  componentDidUpdate() {
    this.props.results.forEach((_, i) => {
      highlightSearchedText(i);
    });
  }

  render() {
    const { results = [], onClickSetting } = this.props;
    const { t } = this.context;

    return (
      <div className="settings-page__header__search__list">
        {Array(5)
          .fill(undefined)
          .map((_, i) => {
            const { image, tab, section } = results[i] || {};

            return (
              Boolean(image || tab || section) && (
                <div key={`settings_${i}`}>
                  <div
                    key={`res_${i}`}
                    className="settings-page__header__search__list__item"
                    onClick={() => onClickSetting(results[i])}
                  >
                    <img
                      className="settings-page__header__search__list__item__icon"
                      src={`./images/${image}`}
                    />

                    <span
                      id={`menu-tab_${i}`}
                      className={classnames(
                        'settings-page__header__search__list__item__tab',
                        {
                          'settings-page__header__search__list__item__tab-multiple-lines':
                            tab === t('securityAndPrivacy'),
                        },
                      )}
                    >
                      {tab}
                    </span>
                    <div className="settings-page__header__search__list__item__caret" />
                    <span
                      id={`menu-section_${i}`}
                      className={classnames(
                        'settings-page__header__search__list__item__section',
                        {
                          'settings-page__header__search__list__item__section-multiple-lines':
                            tab === t('securityAndPrivacy') ||
                            tab === t('alerts'),
                        },
                      )}
                    >
                      {section}
                    </span>
                  </div>
                </div>
              )
            );
          })}
        {results.length === 0 && (
          <div
            className="settings-page__header__search__list__item"
            style={{ cursor: 'auto' }}
          >
            <span className="settings-page__header__search__list__item__no-matching">
              {this.context.t('settingsSearchMatchingNotFound')}
            </span>
          </div>
        )}
        <div
          className="settings-page__header__search__list__item"
          style={{ cursor: 'auto' }}
        >
          <span className="settings-page__header__search__list__item__request">
            {this.context.t('missingSetting')}
          </span>
          <a
            href="https://community.metamask.io/c/feature-requests-ideas/13"
            target="_blank"
            rel="noopener noreferrer"
            key="need-help-link"
            className="settings-page__header__search__list__item__link"
          >
            {this.context.t('missingSettingRequest')}
          </a>
        </div>
      </div>
    );
  }
}
