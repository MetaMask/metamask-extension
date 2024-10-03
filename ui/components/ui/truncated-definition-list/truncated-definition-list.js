import { pick } from 'lodash';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { BorderColor, Size } from '../../../helpers/constants/design-system';
import Box from '../box';
import Button from '../button';
import DefinitionList from '../definition-list/definition-list';
import Popover from '../popover';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function TruncatedDefinitionList({
  dictionary,
  tooltips,
  warnings,
  prefaceKeys,
  title,
}) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const t = useI18nContext();

  const renderDefinitionList = (isFullList) => (
    <DefinitionList
      gap={Size.MD}
      tooltips={tooltips}
      warnings={warnings}
      dictionary={isFullList ? dictionary : pick(dictionary, prefaceKeys)}
    />
  );

  const renderButton = () => (
    <Button
      className="truncated-definition-list__view-more"
      type="link"
      onClick={() => setIsPopoverOpen(true)}
    >
      {t(process.env.CHAIN_PERMISSIONS ? 'seeDetails' : 'viewAllDetails')}
    </Button>
  );

  const renderPopover = () =>
    isPopoverOpen && (
      <Popover
        title={title}
        open={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        footer={
          <Button
            type="primary"
            style={{ width: '50%' }}
            onClick={() => setIsPopoverOpen(false)}
          >
            {t('close')}
          </Button>
        }
      >
        <Box padding={6} paddingTop={0}>
          {renderDefinitionList(true)}
        </Box>
      </Popover>
    );

  const renderContent = () => {
    if (process.env.CHAIN_PERMISSIONS) {
      return isPopoverOpen ? (
        renderDefinitionList(true)
      ) : (
        <>
          {renderDefinitionList(false)}
          {renderButton()}
        </>
      );
    }
    return (
      <>
        {renderDefinitionList(false)}
        {renderButton()}
        {renderPopover()}
      </>
    );
  };

  return (
    <Box
      margin={6}
      padding={4}
      paddingBottom={3}
      borderRadius={Size.LG}
      borderColor={BorderColor.borderMuted}
    >
      {renderContent()}
    </Box>
  );
}

TruncatedDefinitionList.propTypes = {
  dictionary: DefinitionList.propTypes.dictionary,
  tooltips: DefinitionList.propTypes.dictionary,
  warnings: DefinitionList.propTypes.dictionary,
  title: PropTypes.string,
  prefaceKeys: PropTypes.arrayOf(PropTypes.string),
};
