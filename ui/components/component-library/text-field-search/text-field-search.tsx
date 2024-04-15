import React from 'react';
import classnames from 'classnames';
import {
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  TextField,
  TextFieldType,
} from '..';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TextFieldProps } from '../text-field/text-field.types';
import { PolymorphicRef } from '../box';
import {
  TextFieldSearchProps,
  TextFieldSearchComponent,
} from './text-field-search.types';

export const TextFieldSearch: TextFieldSearchComponent = React.forwardRef(
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
