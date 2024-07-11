import { pick } from 'lodash';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { BorderColor, Size } from '../../../helpers/constants/design-system';
import Box from '../box';
import Button from '../button';
import DefinitionList from '../definition-list/definition-list';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function TruncatedDefinitionList({
  dictionary,
  tooltips,
  warnings,
  prefaceKeys,
}) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const t = useI18nContext();

  return (
    <>
      <Box
        margin={6}
        padding={4}
        paddingBottom={3}
        borderRadius={Size.LG}
        borderColor={BorderColor.borderMuted}
      >
        {isPopoverOpen ? (
          <DefinitionList
            gap={Size.MD}
            tooltips={tooltips}
            warnings={warnings}
            dictionary={dictionary}
          />
        ) : (
          <>
            <DefinitionList
              dictionary={pick(dictionary, prefaceKeys)}
              warnings={warnings}
              tooltips={tooltips}
            />
            <Button
              className="truncated-definition-list__view-more"
              type="link"
              onClick={() => setIsPopoverOpen(true)}
            >
              {t('seeDetails')}
            </Button>
          </>
        )}
      </Box>
    </>
  );
}

TruncatedDefinitionList.propTypes = {
  dictionary: DefinitionList.propTypes.dictionary,
  tooltips: DefinitionList.propTypes.dictionary,
  warnings: DefinitionList.propTypes.dictionary,
  prefaceKeys: PropTypes.arrayOf(PropTypes.string),
};
