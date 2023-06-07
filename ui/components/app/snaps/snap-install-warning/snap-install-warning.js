import React, { useCallback, useReducer } from 'react';
import PropTypes from 'prop-types';
import { produce } from 'immer';
import classnames from 'classnames';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import CheckBox from '../../../ui/check-box/check-box.component';

import {
  BackgroundColor,
  IconColor,
  TextVariant,
  TextAlign,
  Size,
  JustifyContent,
  FontWeight,
} from '../../../../helpers/constants/design-system';
import Popover from '../../../ui/popover';
import Button from '../../../ui/button';
import { AvatarIcon, Text, IconName } from '../../../component-library';
import Box from '../../../ui/box/box';

/**
 * a very simple reducer using produce from Immer to keep checkboxes state manipulation
 * immutable and painless.
 */
const checkboxStateReducer = produce((state, action) => {
  switch (action.type) {
    case 'check':
      state[action.checkboxId] = state[action.checkboxId]
        ? !state[action.checkboxId]
        : true;

      break;
    default:
      throw new Error(
        'You must provide a type when dispatching an action for checkboxState',
      );
  }
});

export default function SnapInstallWarning({
  onCancel,
  onSubmit,
  warnings,
  snapName,
}) {
  const t = useI18nContext();
  const [checkboxState, dispatch] = useReducer(checkboxStateReducer, {});

  const isAllChecked = warnings.every((warning) => checkboxState[warning.id]);

  const onCheckboxClicked = useCallback((checkboxId) => {
    dispatch({ type: 'check', checkboxId });
  }, []);

  const SnapInstallWarningFooter = () => {
    return (
      <div className="snap-install-warning__footer">
        <Button
          className="snap-install-warning__footer-button"
          type="primary"
          disabled={!isAllChecked}
          onClick={onSubmit}
        >
          {t('confirm')}
        </Button>
      </div>
    );
  };

  return (
    <Popover
      className="snap-install-warning"
      footer={<SnapInstallWarningFooter />}
      headerProps={{ padding: [6, 6, 0] }}
      contentProps={{
        paddingLeft: [6, 4],
        paddingRight: [6, 4],
        paddingTop: 0,
        paddingBottom: [6, 4],
      }}
      footerProps={{ padding: [4, 6] }}
      onClose={onCancel}
    >
      <Box justifyContent={JustifyContent.center} marginBottom={6}>
        <AvatarIcon
          iconName={IconName.Danger}
          backgroundColor={BackgroundColor.warningMuted}
          color={IconColor.warningDefault}
          size={Size.XL}
        />
      </Box>
      <Text
        paddingBottom={6}
        textAlign={TextAlign.Center}
        variant={TextVariant.headingMd}
        as="h2"
      >
        {t('snapInstallWarningHeading')}
      </Text>
      <Text paddingBottom={6} textAlign={TextAlign.Center}>
        {warnings.length > 1
          ? t('snapInstallWarningCheckPlural', [
              <Text
                key="snapNameInWarningDescription"
                fontWeight={FontWeight.Medium}
                as="span"
              >
                {snapName}
              </Text>,
            ])
          : t('snapInstallWarningCheck', [
              <Text
                key="snapNameInWarningDescription"
                fontWeight={FontWeight.Medium}
                as="span"
              >
                {snapName}
              </Text>,
            ])}
      </Text>
      {warnings.map((warning, i) => (
        <div
          className={classnames('checkbox-label', {
            'checkbox-label--first': i === 0,
          })}
          key={warning.id}
        >
          <CheckBox
            checked={checkboxState[warning.id] ?? false}
            id={warning.id}
            onClick={() => onCheckboxClicked(warning.id)}
          />
          <label htmlFor={warning.id}>
            <Text variant={TextVariant.bodyMd}>{warning.message}</Text>
          </label>
        </div>
      ))}
    </Popover>
  );
}

SnapInstallWarning.propTypes = {
  /**
   * onCancel handler
   */
  onCancel: PropTypes.func,
  /**
   * onSubmit handler
   */
  onSubmit: PropTypes.func,
  /**
   * warnings list
   */
  warnings: PropTypes.arrayOf({
    message: PropTypes.node,
    id: PropTypes.string,
  }),
  /**
   * Snap name
   */
  snapName: PropTypes.string.isRequired,
};
