import React, { useState } from 'react';
import {
  SIZES,
  ALIGN_ITEMS,
  DISPLAY,
  COLORS,
  ICON_COLORS,
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
  TEXT,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { Text } from '../text';

import { Icon } from './icon';
import { ICON_NAMES } from './icon.constants';

import README from './README.mdx';

const marginSizeControlOptions = [
  undefined,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  'auto',
];

export default {
  title: 'Components/ComponentLibrary/Icon',
  id: __filename,
  component: Icon,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    name: {
      control: 'select',
      options: Object.values(ICON_NAMES),
    },
    size: {
      control: 'select',
      options: Object.values(SIZES),
    },
    color: {
      control: 'select',
      options: Object.values(ICON_COLORS),
    },
    className: {
      control: 'text',
    },
    marginTop: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginRight: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginBottom: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginLeft: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
  },
  args: {
    name: ICON_NAMES.ADD_SQUARE_FILLED,
    color: COLORS.INHERIT,
    size: SIZES.MD,
  },
};

export const DefaultStory = (args) => <Icon {...args} />;

DefaultStory.storyName = 'Default';

export const Name = (args) => {
  const [search, setSearch] = useState('');
  const iconList = Object.keys(ICON_NAMES)
    .filter(
      (item) =>
        search === '' ||
        item.toLowerCase().includes(search.toLowerCase().replace(' ', '_')),
    )
    .sort();

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  return (
    <>
      <Text as="h2" marginBottom={2} variant={TEXT.HEADING_MD}>
        Icon search
      </Text>
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
      </Box>

      <Box
        display={DISPLAY.GRID}
        gap={2}
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
      >
        {iconList.length > 0 ? (
          <>
            {iconList.map((item) => {
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
                    <Icon marginBottom={2} {...args} name={ICON_NAMES[item]} />
                  </Box>
                  <Text
                    variant={TEXT.BODY_XS}
                    as="pre"
                    style={{ cursor: 'pointer' }}
                    backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
                    paddingLeft={2}
                    paddingRight={2}
                    paddingTop={1}
                    paddingBottom={1}
                    borderRadius={SIZES.SM}
                    title="Copy to clipboard"
                    onClick={() => {
                      const tempEl = document.createElement('textarea');
                      tempEl.value = item;
                      document.body.appendChild(tempEl);
                      tempEl.select();
                      document.execCommand('copy');
                      document.body.removeChild(tempEl);
                    }}
                  >
                    {item}
                  </Text>
                </Box>
              );
            })}
          </>
        ) : (
          <Text>
            No matches. Please try again or ask in the{' '}
            <Text
              as="a"
              color={COLORS.PRIMARY_DEFAULT}
              href="https://consensys.slack.com/archives/C0354T27M5M"
              target="_blank"
            >
              #metamask-design-system
            </Text>{' '}
            channel on slack.
          </Text>
        )}
      </Box>
    </>
  );
};

export const Size = (args) => (
  <>
    <Box
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.BASELINE}
      gap={1}
      marginBottom={4}
    >
      <Icon {...args} size={SIZES.XXS} />
      <Icon {...args} size={SIZES.XS} />
      <Icon {...args} size={SIZES.SM} />
      <Icon {...args} size={SIZES.MD} />
      <Icon {...args} size={SIZES.LG} />
      <Icon {...args} size={SIZES.XL} />
    </Box>
    <Text as="p" variant={TEXT.BODY_SM}>
      <Icon {...args} size={SIZES.AUTO} /> Auto also exists and inherits the
      font-size of the parent element.
    </Text>
  </>
);
export const Color = (args) => (
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
