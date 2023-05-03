import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import Popover from '../../../ui/popover';
import Button from '../../../ui/button';
import { TextVariant } from '../../../../helpers/constants/design-system';
import { Text } from '../../../component-library';

const DetectedTokenIgnoredPopover = ({
  partiallyIgnoreDetectedTokens,
  onCancelIgnore,
  handleClearTokensSelection,
}) => {
  const t = useI18nContext();

  const footer = (
    <>
      <Button
        className="detected-token-ignored-popover__ignore-button"
        type="secondary"
        onClick={onCancelIgnore}
      >
        {t('cancel')}
      </Button>
      <Button
        className="detected-token-ignored-popover__import-button"
        type="primary"
        onClick={handleClearTokensSelection}
      >
        {t('confirm')}
      </Button>
    </>
  );

  return (
    <Popover
      title={
        partiallyIgnoreDetectedTokens
          ? t('importSelectedTokens')
          : t('areYouSure')
      }
      className={classNames('detected-token-ignored-popover', {
        'detected-token-ignored-popover--import': partiallyIgnoreDetectedTokens,
        'detected-token-ignored-popover--ignore':
          !partiallyIgnoreDetectedTokens,
      })}
      footer={footer}
    >
      <Text
        variant={TextVariant.bodySm}
        as="h6"
        marginTop={0}
        marginRight={5}
        marginBottom={7}
        marginLeft={5}
      >
        {partiallyIgnoreDetectedTokens
          ? t('importSelectedTokensDescription')
          : t('ignoreTokenWarning')}
      </Text>
    </Popover>
  );
};

DetectedTokenIgnoredPopover.propTypes = {
  partiallyIgnoreDetectedTokens: PropTypes.bool.isRequired,
  onCancelIgnore: PropTypes.func.isRequired,
  handleClearTokensSelection: PropTypes.func.isRequired,
};

export default DetectedTokenIgnoredPopover;
