// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck types are very broken
/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';
import { FileUploader } from './file-uploader';
import { FormTextFieldSize } from './form-text-field.types';

describe('FormTextField', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(
      <FileUploader data-testid="file-uploader" />,
    );
    expect(getByTestId('file-uploader')).toBeDefined();
  });
});
