import React from 'react';
import { action } from '@storybook/addon-actions';
import classnames from 'classnames';
import { text, boolean } from '@storybook/addon-knobs';
import Button from '../button';
import ButtonGroup from '.';

export default {
  title: 'ButtonGroup',
};

export const withButtons = () => (
  <ButtonGroup
    style={{ width: '300px' }}
    disabled={boolean('Disabled', false)}
    defaultActiveButtonIndex={1}
  >
    <Button onClick={action('cheap')}>{text('Button1', 'Cheap')}</Button>
    <Button onClick={action('average')}>{text('Button2', 'Average')}</Button>
    <Button onClick={action('fast')}>{text('Button3', 'Fast')}</Button>
  </ButtonGroup>
);

export const withDisabledButton = () => (
  <ButtonGroup style={{ width: '300px' }} disabled={boolean('Disabled', false)}>
    <Button onClick={action('enabled')}>{text('Button1', 'Enabled')}</Button>
    <Button onClick={action('disabled')} disabled>
      {text('Button2', 'Disabled')}
    </Button>
  </ButtonGroup>
);

export const radioButtons = () => (
  <ButtonGroup
    style={{ width: '300px' }}
    defaultActiveButtonIndex={1}
    variant="radiogroup"
  >
    <Button onClick={action('radio 1')}>{text('Button1', '1%')}</Button>
    <Button onClick={action('radio 2')}>{text('Button2', '2%')}</Button>
    <Button
      onClick={action('radio 3')}
      className={classnames({
        'radio-button--danger': boolean('Button3 warning', false),
      })}
    >
      {text('Button3', '5%')}
    </Button>
  </ButtonGroup>
);
