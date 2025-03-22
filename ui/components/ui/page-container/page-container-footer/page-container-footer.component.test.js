import React from 'react';
import { fireEvent } from '@testing-library/react';

import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { Icon, IconName } from '../../../component-library';
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

    it('has danger class defined if type is danger', () => {
      const { queryByTestId } = renderWithProvider(
        <PageFooter {...props} submitButtonType="danger" />,
      );

      const submitButton = queryByTestId('page-container-footer-next');

      expect(submitButton.className).toContain('danger');
    });

    it('has danger-primary class defined if type is danger-primary', () => {
      const { queryByTestId } = renderWithProvider(
        <PageFooter {...props} submitButtonType="danger-primary" />,
      );

      const submitButton = queryByTestId('page-container-footer-next');

      console.log(submitButton.className);
      expect(submitButton.className).toContain('danger-primary');
    });

    it('renders submitButtonIcon if passed', () => {
      const { getByTestId } = renderWithProvider(
        <PageFooter
          {...props}
          submitButtonIcon={
            <Icon name={IconName.Add} data-testid="icon-test-id" />
          }
        />,
      );

      expect(getByTestId('icon-test-id')).toBeInTheDocument();
    });
  });
});
