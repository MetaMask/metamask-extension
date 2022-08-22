import React, { useState } from 'react';

import {
  DISPLAY,
  COLORS,
  SIZES,
  FLEX_DIRECTION,
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';

/*eslint import/namespace: ['error', { allowComputed: true }]*/
import * as Icons from './lib';

import {
  addMenuExplore,
  arrows,
  confirmationsWarningsCheck,
  devices,
  editCopyDelete,
  expandLinkExportImportLogInLogOut,
  favLikeQuestionInfoMessage,
  gas,
  graphicsSymbols,
  learning,
  loading,
  notifications,
  programing,
  search as searchFilter,
  security,
  settings,
  snaps,
  theme,
  time,
  transactions,
  user,
} from './filters';
import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/Icons',
  id: __filename,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(SIZES),
    },
    color: {
      control: 'select',
      options: [
        COLORS.INHERIT,
        COLORS.ICON_DEFAULT,
        COLORS.ICON_ALTERNATIVE,
        COLORS.ICON_MUTED,
        COLORS.PRIMARY_DEFAULT,
        COLORS.PRIMARY_INVERSE,
        COLORS.SECONDARY_DEFAULT,
        COLORS.SECONDARY_INVERSE,
        COLORS.ERROR_DEFAULT,
        COLORS.ERROR_INVERSE,
        COLORS.SUCCESS_DEFAULT,
        COLORS.SUCCESS_INVERSE,
        COLORS.WARNING_INVERSE,
        COLORS.INFO_DEFAULT,
        COLORS.INFO_INVERSE,
        COLORS.TEXT_DEFAULT,
        COLORS.TEXT_ALTERNATIVE,
        COLORS.TEXT_MUTED,
      ],
    },
    icon: {
      control: 'select',
      options: Object.keys(Icons),
    },
  },
  args: {
    icon: 'IconAddSquareFilled',
  },
};

export const DefaultStory = (args) => {
  const Icon = Icons[args.icon];
  return <Icon {...args} />;
};

DefaultStory.storyName = 'Default';

export const Size = (args) => {
  const Icon = Icons[args.icon];
  return (
    <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
      <Icon {...args} size={SIZES.XXS} />
      <Icon {...args} size={SIZES.XS} />
      <Icon {...args} size={SIZES.SM} />
      <Icon {...args} size={SIZES.MD} />
      <Icon {...args} size={SIZES.LG} />
      <Icon {...args} size={SIZES.XL} />
    </Box>
  );
};

export const Color = (args) => {
  const Icon = Icons[args.icon];
  return (
    <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE}>
      <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
        <Icon {...args} color={COLORS.INHERIT} />
      </Box>
      <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
        <Icon {...args} color={COLORS.ICON_DEFAULT} />
      </Box>
      <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
        <Icon {...args} color={COLORS.ICON_ALTERNATIVE} />
      </Box>
      <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
        <Icon {...args} color={COLORS.ICON_MUTED} />
      </Box>
      <Box
        padding={1}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        backgroundColor={COLORS.OVERLAY_DEFAULT}
      >
        <Icon {...args} color={COLORS.OVERLAY_INVERSE} />
      </Box>
      <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
        <Icon {...args} color={COLORS.PRIMARY_DEFAULT} />
      </Box>
      <Box
        padding={1}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        backgroundColor={COLORS.PRIMARY_DEFAULT}
      >
        <Icon {...args} color={COLORS.PRIMARY_INVERSE} />
      </Box>
      <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
        <Icon {...args} color={COLORS.ERROR_DEFAULT} />
      </Box>
      <Box
        padding={1}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        backgroundColor={COLORS.ERROR_DEFAULT}
      >
        <Icon {...args} color={COLORS.ERROR_INVERSE} />
      </Box>
      <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
        <Icon {...args} color={COLORS.SUCCESS_DEFAULT} />
      </Box>
      <Box
        padding={1}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        backgroundColor={COLORS.SUCCESS_DEFAULT}
      >
        <Icon {...args} color={COLORS.SUCCESS_INVERSE} />
      </Box>
      <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
        <Icon {...args} color={COLORS.WARNING_DEFAULT} />
      </Box>
      <Box
        padding={1}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        backgroundColor={COLORS.WARNING_DEFAULT}
      >
        <Icon {...args} color={COLORS.WARNING_INVERSE} />
      </Box>
      <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
        <Icon {...args} color={COLORS.INFO_DEFAULT} />
      </Box>
      <Box
        padding={1}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        backgroundColor={COLORS.INFO_DEFAULT}
      >
        <Icon {...args} color={COLORS.INFO_INVERSE} />
      </Box>
    </Box>
  );
};

export const IconSearch = (args) => {
  const [search, setSearch] = useState('');
  const [filteredIconList, setFilteredIconList] = useState(Icons);
  const iconList = Object.keys(filteredIconList)
    .filter(
      (item) =>
        search === '' || item.toLowerCase().includes(search.toLowerCase()),
    )
    .sort();

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleFilterSelect = (e) => {
    const filters = {
      addMenuExplore,
      arrows,
      confirmationsWarningsCheck,
      devices,
      editCopyDelete,
      expandLinkExportImportLogInLogOut,
      favLikeQuestionInfoMessage,
      gas,
      graphicsSymbols,
      learning,
      loading,
      notifications,
      programing,
      searchFilter,
      security,
      settings,
      snaps,
      theme,
      time,
      transactions,
      user,
    };
    if (e.target.value === 'all') {
      setFilteredIconList(Icons);
    } else {
      const filterList = filters[e.target.value];
      const filteredIcons = Object.keys(Icons)
        .filter((key) => filterList.includes(key))
        .reduce((obj, key) => {
          obj[key] = Icons[key];
          return obj;
        }, {});
      setFilteredIconList(filteredIcons);
    }
  };

  return (
    <>
      <Box
        as="h1"
        marginBottom={2}
        style={{
          fontSize: 'var(--typography-l-heading-lg-font-size)',
          fontWeight: 'var(--typography-l-heading-lg-font-weight)',
        }}
      >
        Icon search
      </Box>
      <Box display={DISPLAY.FLEX}>
        <Box
          marginBottom={4}
          borderColor={COLORS.BORDER_DEFAULT}
          borderRadius={SIZES.SM}
          as="input"
          type="text"
          onChange={handleSearch}
          value={search}
          placeholder="Search"
          paddingLeft={2}
          paddingRight={2}
          style={{
            height: '40px',
            width: '100%',
            maxWidth: '300px',
            fontSize: 'var(--typography-l-body-md-font-size)',
          }}
        />
        <Box
          as="select"
          onChange={handleFilterSelect}
          defaultValue="all"
          marginLeft={2}
          marginBottom={4}
          borderColor={COLORS.BORDER_DEFAULT}
          borderRadius={SIZES.SM}
          paddingLeft={2}
          paddingRight={8}
          style={{
            height: '40px',
            width: '100%',
            maxWidth: '300px',
            fontSize: 'var(--typography-l-body-md-font-size)',
            appearance: 'none',
            backgroundImage:
              "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            backgroundSize: '16px',
          }}
        >
          <option value="all">All icons (no filter)</option>
          <option value="addMenuExplore">Add Menu Explore</option>
          <option value="arrows">Arrows</option>
          <option value="confirmationsWarningsCheck">
            Confirmations Warnings Check
          </option>
          <option value="devices">Devices</option>
          <option value="editCopyDelete">Edit Copy Delete</option>
          <option value="expandLinkExportImportLogInLogOut">
            Expand Link Export Import Log In Log Out
          </option>
          <option value="favLikeQuestionInfoMessage">
            Fav Like Question Info Message
          </option>
          <option value="gas">Gas</option>
          <option value="graphicsSymbols">Graphics Symbols</option>
          <option value="learning">Learning</option>
          <option value="loading">Loading</option>
          <option value="notifications">Notifications</option>
          <option value="programing">Programing</option>
          <option value="search">Search</option>
          <option value="security">Security</option>
          <option value="settings">Settings</option>
          <option value="snaps">Snaps</option>
          <option value="theme">Theme</option>
          <option value="time">Time</option>
          <option value="transactions">Transactions</option>
          <option value="user">User</option>
        </Box>
      </Box>

      <Box
        display={DISPLAY.GRID}
        gap={2}
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
      >
        {iconList.length > 0 && (
          <>
            {iconList.map((item) => {
              const Icon = Icons[item];
              return (
                <Box
                  borderColor={COLORS.BORDER_MUTED}
                  borderRadius={SIZES.MD}
                  display={DISPLAY.FLEX}
                  flexDirection={FLEX_DIRECTION.COLUMN}
                  alignItems={ALIGN_ITEMS.CENTER}
                  justifyContent={JUSTIFY_CONTENT.CENTER}
                  padding={4}
                  key={item}
                >
                  <Box>
                    <Icon marginBottom={2} {...args} />
                  </Box>
                  <Box as="pre">{item}</Box>
                </Box>
              );
            })}
          </>
        )}
      </Box>
      <Box
        padding={4}
        borderColor={COLORS.BORDER_MUTED}
        borderRadius={SIZES.MD}
        backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
        marginTop={4}
        style={{ fontFamily: 'monospace' }}
      >
        <Box as="code">
          import {' { '}
          {iconList.map((item, index) => {
            return index === iconList.length - 1 ? <>{item}</> : <>{item}, </>;
          })}
          {' }'} from &apos;../ui/components/component-library&apos;;
        </Box>
        <Box
          as="button"
          borderRadius={SIZES.XL}
          borderColor={COLORS.PRIMARY_DEFAULT}
          backgroundColor={COLORS.BACKGROUND_DEFAULT}
          color={COLORS.PRIMARY_DEFAULT}
          marginLeft={1}
          marginTop={1}
          paddingLeft={4}
          paddingRight={4}
          style={{
            height: '32px',
            fontSize: 'var(--typography-l-body-md-font-size)',
            borderRadius: '30px',
            lineHeight: 1,
          }}
          onClick={() => {
            const tempEl = document.createElement('textarea');
            tempEl.value = `import { ${iconList.join(
              ', ',
            )} } from '../ui/components/component-library/icons'`;
            document.body.appendChild(tempEl);
            tempEl.select();
            document.execCommand('copy');
            document.body.removeChild(tempEl);
          }}
        >
          {' '}
          Copy
        </Box>
      </Box>
    </>
  );
};
