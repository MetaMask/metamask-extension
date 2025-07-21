import React from 'react';
import classnames from 'classnames';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TextFieldProps, TextFieldType } from '../text-field/text-field.types';
import { PolymorphicRef } from '../box';
import { TextField } from '../text-field';
import { ButtonIcon, ButtonIconSize } from '../button-icon';
import { Icon, IconName, IconSize } from '../icon';
import {
  TextFieldSearchProps,
  TextFieldSearchComponent,
} from './text-field-search.types';

export const TextFieldSearch: TextFieldSearchComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'input'>(
    {
      className = '',
      showClearButton = true,
      clearButtonOnClick,
      clearButtonProps,
      endAccessory,
      inputProps,
      value,
      onChange,
      ...props
    }: TextFieldSearchProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const t = useI18nContext();

    return (
      <TextField
        className={classnames('mm-text-field-search', className)}
        ref={ref}
        value={value}
        onChange={onChange}
        type={TextFieldType.Search}
        endAccessory={
          value && showClearButton ? (
            <>
              <ButtonIcon
                className="mm-text-field__button-clear"
                data-testid="text-field-search-clear-button"
                ariaLabel={t('clear')}
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                onClick={clearButtonOnClick}
                {...clearButtonProps}
              />
              {endAccessory}
            </>
          ) : (
            endAccessory
          )
        }
        startAccessory={<Icon name={IconName.Search} size={IconSize.Sm} />}
        inputProps={{
          marginRight: showClearButton ? 6 : 0,
          ...inputProps,
        }}
        {...(props as TextFieldProps<C>)}
      />
    );
  },
);
