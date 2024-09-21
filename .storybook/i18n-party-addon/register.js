// import { useGlobals } from '@storybook/api';
const { useGlobals } = require('@storybook/api');
const React = require('react');
const { addons, types } = require('@storybook/addons');
const { Icons, IconButton } = require('@storybook/components');
const localeList = require('../../app/_locales/index.json');
const { useEffect } = React;

addons.register('i18n-party', () => {
  addons.add('i18n-party', {
    title: 'rotates through every i18n locale',
    //👇 Sets the type of UI element in Storybook
    type: types.TOOL,
    match: () => true,
    render: (...args) => {
      // https://github.com/storybookjs/storybook/blob/6490a0d646dbaa293b76bbde477daca615efe789/addons/toolbars/src/components/MenuToolbar.tsx#L2
      const [globals, updateGlobals] = useGlobals();
      useEffect(() => {
        if (!globals.localeParty) return;
        const interval = setInterval((...args) => {
          const currentIndex = localeList.findIndex(
            ({ code }) => code === globals.locale,
          );
          const nextIndex = (currentIndex + 1) % localeList.length;
          const nextLocale = localeList[nextIndex].code;
          updateGlobals({ locale: nextLocale });
        }, 2000);
        return () => clearInterval(interval);
      });

      return (
        <IconButton
          onClick={() => updateGlobals({ localeParty: !globals.localeParty })}
        >
          <Icons icon={globals.localeParty ? 'star' : 'starhollow'} />
          <span>&nbsp;Shuffle i18n locale</span>
        </IconButton>
      );
    },
  });
});
