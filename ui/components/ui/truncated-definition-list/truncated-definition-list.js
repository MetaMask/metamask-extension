import { pick } from 'lodash';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';
import Box from '../box';
import Button from '../button';
import DefinitionList from '../definition-list/definition-list';
import Popover from '../popover';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function TruncatedDefinitionList({
  dictionary,
  tooltips,
  prefaceKeys,
  title,
}) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const t = useI18nContext();

  return (
    <>
      <Box
        margin={6}
        padding={4}
        paddingBottom={3}
        borderRadius={SIZES.LG}
        borderColor={COLORS.UI2}
      >
        <DefinitionList
          dictionary={pick(dictionary, prefaceKeys)}
          tooltips={tooltips}
        />
        <Button
          className="truncated-definition-list__view-more"
          type="link"
          onClick={() => setIsPopoverOpen(true)}
        >
          {t('viewAllDetails')}
        </Button>
      </Box>
      {isPopoverOpen && (
        <Popover
          title={title}
          open={isPopoverOpen}
          onClose={() => setIsPopoverOpen(false)}
          footer={
            <>
              <div />
              <Button
                type="primary"
                style={{ width: '50%' }}
                rounded
                onClick={() => setIsPopoverOpen(false)}
              >
                Close
              </Button>
            </>
          }
        >
          <Box padding={6} paddingTop={0}>
            <DefinitionList
              gap={SIZES.MD}
              tooltips={tooltips}
              dictionary={dictionary}
            />
          </Box>
        </Popover>
      )}
    </>
  );
}

TruncatedDefinitionList.propTypes = {
  dictionary: DefinitionList.propTypes.dictionary,
  tooltips: DefinitionList.propTypes.dictionary,
  title: PropTypes.string,
  prefaceKeys: PropTypes.arrayOf(PropTypes.string),
};
