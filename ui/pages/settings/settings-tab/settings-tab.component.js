import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import availableCurrencies from '../../../helpers/constants/available-conversions.json';
import {
  TextVariant,
  TextColor,
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
} from '../../../helpers/constants/design-system';
import Dropdown from '../../../components/ui/dropdown';
import ToggleButton from '../../../components/ui/toggle-button';
import locales from '../../../../app/_locales/index.json';
import Jazzicon from '../../../components/ui/jazzicon';
import BlockieIdenticon from '../../../components/ui/identicon/blockieIdenticon';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';

import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import { ThemeType } from '../../../../shared/constants/preferences';
import { Text, Box } from '../../../components/component-library';

const sortedCurrencies = availableCurrencies.sort((a, b) => {
  return a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase());
});

const currencyOptions = sortedCurrencies.map(({ code, name }) => {
  return {
    name: `${code.toUpperCase()} - ${name}`,
    value: code,
  };
});

const localeOptions = locales.map((locale) => {
  return {
    name: `${locale.name}`,
    value: locale.code,
  };
});

export default class SettingsTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    setUseBlockie: PropTypes.func,
    setCurrentCurrency: PropTypes.func,
    warning: PropTypes.string,
    updateCurrentLocale: PropTypes.func,
    currentLocale: PropTypes.string,
    useBlockie: PropTypes.bool,
    currentCurrency: PropTypes.string,
    hideZeroBalanceTokens: PropTypes.bool,
    setHideZeroBalanceTokens: PropTypes.func,
    lastFetchedConversionDate: PropTypes.number,
    selectedAddress: PropTypes.string,
    tokenList: PropTypes.object,
    theme: PropTypes.string,
    setTheme: PropTypes.func,
  };

  settingsRefs = Array(
    getNumberOfSettingRoutesInTab(this.context.t, this.context.t('general')),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

  componentDidUpdate() {
    const { t } = this.context;
    handleSettingsRefs(t, t('general'), this.settingsRefs);
  }

  componentDidMount() {
    const { t } = this.context;
    handleSettingsRefs(t, t('general'), this.settingsRefs);
  }

  renderCurrentConversion() {
    const { t } = this.context;
    const { currentCurrency, setCurrentCurrency, lastFetchedConversionDate } =
      this.props;

    return (
      <Box
        ref={this.settingsRefs[0]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
      >
        <div className="settings-page__content-item">
          <span>{t('currencyConversion')}</span>
          <span className="settings-page__content-description">
            {lastFetchedConversionDate
              ? t('updatedWithDate', [
                  new Date(lastFetchedConversionDate * 1000).toString(),
                ])
              : t('noConversionDateAvailable')}
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Dropdown
              data-testid="currency-select"
              id="select-currency"
              options={currencyOptions}
              selectedOption={currentCurrency}
              onChange={(newCurrency) => setCurrentCurrency(newCurrency)}
            />
          </div>
        </div>
      </Box>
    );
  }

  renderCurrentLocale() {
    const { t } = this.context;
    const { updateCurrentLocale, currentLocale } = this.props;
    const currentLocaleMeta = locales.find(
      (locale) => locale.code === currentLocale,
    );
    const currentLocaleName = currentLocaleMeta ? currentLocaleMeta.name : '';

    return (
      <Box
        ref={this.settingsRefs[2]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
      >
        <div className="settings-page__content-item">
          <span className="settings-page__content-label">
            {t('currentLanguage')}
          </span>
          <span className="settings-page__content-description">
            {currentLocaleName}
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Dropdown
              data-testid="locale-select"
              id="select-locale"
              options={localeOptions}
              selectedOption={currentLocale}
              onChange={async (newLocale) => updateCurrentLocale(newLocale)}
            />
          </div>
        </div>
      </Box>
    );
  }

  renderHideZeroBalanceTokensOptIn() {
    const { t } = this.context;
    const { hideZeroBalanceTokens, setHideZeroBalanceTokens } = this.props;

    return (
      <Box
        ref={this.settingsRefs[5]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        id="toggle-zero-balance"
      >
        <div className="settings-page__content-item">
          <span>{t('hideZeroBalanceTokens')}</span>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={hideZeroBalanceTokens}
            onToggle={(value) => setHideZeroBalanceTokens(!value)}
            offLabel={t('off')}
            onLabel={t('on')}
          />
        </div>
      </Box>
    );
  }

  renderBlockieOptIn() {
    const { t } = this.context;
    const { useBlockie, setUseBlockie, selectedAddress, tokenList } =
      this.props;

    const getIconStyles = () => ({
      display: 'block',
      borderRadius: '16px',
      width: '32px',
      height: '32px',
    });

    return (
      <Box
        ref={this.settingsRefs[4]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        id="blockie-optin"
      >
        <div className="settings-page__content-item">
          <Text
            variant={TextVariant.bodyMd}
            as="h5"
            color={TextColor.textDefault}
          >
            {t('accountIdenticon')}
          </Text>
          <span className="settings-page__content-item__description">
            {t('jazzAndBlockies')}
          </span>
          <div className="settings-page__content-item__identicon">
            <button
              data-testid="jazz_icon"
              onClick={() => setUseBlockie(false)}
              className="settings-page__content-item__identicon__item"
            >
              <div
                className={classnames(
                  'settings-page__content-item__identicon__item__icon',
                  {
                    'settings-page__content-item__identicon__item__icon--active':
                      !useBlockie,
                  },
                )}
              >
                <Jazzicon
                  id="jazzicon"
                  address={selectedAddress}
                  diameter={32}
                  tokenList={tokenList}
                  style={getIconStyles()}
                />
              </div>
              <Text
                color={TextColor.textDefault}
                variant={TextVariant.bodySm}
                as="h6"
                marginTop={0}
                marginRight={12}
                marginBottom={0}
                marginLeft={3}
              >
                {t('jazzicons')}
              </Text>
            </button>
            <button
              data-testid="blockie_icon"
              onClick={() => setUseBlockie(true)}
              className="settings-page__content-item__identicon__item"
            >
              <div
                className={classnames(
                  'settings-page__content-item__identicon__item__icon',
                  {
                    'settings-page__content-item__identicon__item__icon--active':
                      useBlockie,
                  },
                )}
              >
                <BlockieIdenticon
                  id="blockies"
                  address={selectedAddress}
                  diameter={32}
                  borderRadius="50%"
                />
              </div>
              <Text
                color={TextColor.textDefault}
                variant={TextVariant.bodySm}
                as="h6"
                marginTop={3}
                marginRight={0}
                marginBottom={3}
                marginLeft={3}
              >
                {t('blockies')}
              </Text>
            </button>
          </div>
        </div>
      </Box>
    );
  }

  renderTheme() {
    const { t } = this.context;
    const { theme, setTheme } = this.props;

    const themesOptions = [
      {
        name: t('lightTheme'),
        value: ThemeType.light,
      },
      {
        name: t('darkTheme'),
        value: ThemeType.dark,
      },
      {
        name: t('osTheme'),
        value: ThemeType.os,
      },
    ];

    const onChange = (newTheme) => {
      this.context.trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: 'Theme Changed',
        properties: {
          theme_selected: newTheme,
        },
      });
      setTheme(newTheme);
    };

    return (
      <Box
        ref={this.settingsRefs[3]}
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
      >
        <div className="settings-page__content-item">
          <span>{this.context.t('theme')}</span>
          <div className="settings-page__content-description">
            {this.context.t('themeDescription')}
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Dropdown
              id="select-theme"
              options={themesOptions}
              selectedOption={theme}
              onChange={onChange}
            />
          </div>
        </div>
      </Box>
    );
  }

  render() {
    const { warning } = this.props;

    return (
      <div className="settings-page__body">
        {warning ? <div className="settings-tab__error">{warning}</div> : null}
        {this.renderCurrentConversion()}
        {this.renderCurrentLocale()}
        {this.renderTheme()}
        {this.renderBlockieOptIn()}
        {this.renderHideZeroBalanceTokensOptIn()}
      </div>
    );
  }
}
