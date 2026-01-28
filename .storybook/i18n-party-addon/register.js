const { addons, types, useGlobals } = require('@storybook/manager-api');
const React = require('react');
const { IconButton } = require('@storybook/components');
const { Icons } = require('@storybook/icons');
const localeList = require('../../app/_locales/index.json');
const { useEffect } = React;

const I18nPartyTool = () => {
  const [globals, updateGlobals] = useGlobals();
  const active = Boolean(globals.localeParty);

  // If globals are not ready, avoid rendering to prevent invalid element errors.
  if (!globals) {
    return null;
  }

  useEffect(() => {
    if (!active || !Array.isArray(localeList) || localeList.length === 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      const currentIndex = localeList.findIndex(
        ({ code }) => code === globals.locale,
      );
      const nextIndex =
        (currentIndex + 1 + localeList.length) % localeList.length;
      const nextLocale = localeList[nextIndex].code;
      updateGlobals({ locale: nextLocale });
    }, 2000);

    return () => clearInterval(interval);
  }, [active, globals.locale, updateGlobals]);

  const toggle = () => updateGlobals({ localeParty: !active });

  return (
    <IconButton title="Shuffle i18n locale" active={active} onClick={toggle}>
      <Icons icon={active ? 'globe' : 'globe'} />
      <span style={{ marginLeft: 4 }}>Shuffle i18n locale</span>
    </IconButton>
  );
};

addons.register('i18n-party', () => {
  addons.add('i18n-party', {
    title: 'rotates through every i18n locale',
    type: types.TOOL,
    // Temporarily disabled to unblock Storybook manager error; re-enable after validation.
    match: () => false,
    render: () => <I18nPartyTool />,
  });
});
