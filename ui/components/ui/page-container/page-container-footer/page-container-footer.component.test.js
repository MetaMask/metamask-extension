import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import PageFooter from '.';

describe('Page Footer', () => {
  const props = {
    onCancel: jest.fn(),
    onSubmit: jest.fn(),
    cancelText: 'Cancel',
    submitText: 'Submit',
    disabled: false,
    submitButtonType: 'Test Type',
  };

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<PageFooter {...props} />);

    expect(container).toMatchSnapshot();
  });

  it('should render a secondary footer inside page-container__footer when given children', () => {
    const { container } = renderWithProvider(
      <PageFooter>
        <div>Works</div>
      </PageFooter>,
    );

    expect(container).toMatchSnapshot();
  });

  describe('Cancel Button', () => {
    it('should call cancel when click is simulated', () => {
      const { queryByTestId } = renderWithProvider(<PageFooter {...props} />);

      const cancelButton = queryByTestId('page-container-footer-cancel');

      fireEvent.click(cancelButton);

      expect(props.onCancel).toHaveBeenCalled();
    });
  });

  describe('Submit Button', () => {
    it('should call submit when click is simulated', () => {
      const { queryByTestId } = renderWithProvider(<PageFooter {...props} />);

      const submitButton = queryByTestId('page-container-footer-next');

      fireEvent.click(submitButton);

      expect(props.onSubmit).toHaveBeenCalled();
    });
  });
});
