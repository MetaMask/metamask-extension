import React from 'react';
import { isInaccessible, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShowHideToggle from '.';

describe('ShowHideToggle', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should set title', async () => {
    const onChange = jest.fn();
    const { queryByTitle } = render(
      <ShowHideToggle
        id="example"
        ariaLabelHidden="hidden"
        ariaLabelShown="shown"
        shown
        onChange={onChange}
        title="example-title"
      />,
    );

    expect(queryByTitle('example-title')).toBeInTheDocument();
  });

  it('should set test ID', async () => {
    const onChange = jest.fn();
    const { queryByTestId } = render(
      <ShowHideToggle
        id="example"
        ariaLabelHidden="hidden"
        ariaLabelShown="shown"
        shown
        onChange={onChange}
        data-testid="example-test-id"
      />,
    );

    expect(queryByTestId('example-test-id')).toBeInTheDocument();
  });

  it('should show correct aria-label when shown', () => {
    const onChange = jest.fn();
    const { queryByLabelText } = render(
      <ShowHideToggle
        id="example"
        ariaLabelHidden="hidden"
        ariaLabelShown="shown"
        shown
        onChange={onChange}
      />,
    );

    expect(queryByLabelText('hidden')).not.toBeInTheDocument();
    expect(queryByLabelText('shown')).toBeInTheDocument();
  });

  it('should show correct aria-label when hidden', () => {
    const onChange = jest.fn();
    const { queryByLabelText } = render(
      <ShowHideToggle
        id="example"
        ariaLabelHidden="hidden"
        ariaLabelShown="shown"
        shown={false}
        onChange={onChange}
      />,
    );

    expect(queryByLabelText('hidden')).toBeInTheDocument();
    expect(queryByLabelText('shown')).not.toBeInTheDocument();
  });

  it('should show correct checkbox state when shown', () => {
    const onChange = jest.fn();
    const { queryByRole } = render(
      <ShowHideToggle
        id="example"
        ariaLabelHidden="hidden"
        ariaLabelShown="shown"
        shown
        onChange={onChange}
      />,
    );

    expect(queryByRole('checkbox')).toBeChecked();
  });

  it('should show correct checkbox state when hidden', () => {
    const onChange = jest.fn();
    const { queryByRole } = render(
      <ShowHideToggle
        id="example"
        ariaLabelHidden="hidden"
        ariaLabelShown="shown"
        shown={false}
        onChange={onChange}
      />,
    );

    expect(queryByRole('checkbox')).not.toBeChecked();
  });

  describe('enabled', () => {
    it('should show checkbox as enabled', () => {
      const onChange = jest.fn();
      const { queryByRole } = render(
        <ShowHideToggle
          id="example"
          ariaLabelHidden="hidden"
          ariaLabelShown="shown"
          shown
          onChange={onChange}
        />,
      );

      expect(queryByRole('checkbox')).toBeEnabled();
    });

    it('should be accessible', () => {
      const onChange = jest.fn();
      const { queryByRole } = render(
        <ShowHideToggle
          id="example"
          ariaLabelHidden="hidden"
          ariaLabelShown="shown"
          shown
          onChange={onChange}
        />,
      );

      expect(isInaccessible(queryByRole('checkbox'))).toBeFalsy();
    });

    describe('shown', () => {
      it('should call onChange when clicked', async () => {
        const onChange = jest.fn();
        const { queryByRole } = render(
          <ShowHideToggle
            id="example"
            ariaLabelHidden="hidden"
            ariaLabelShown="shown"
            shown
            onChange={onChange}
          />,
        );
        await userEvent.click(queryByRole('checkbox'));

        expect(onChange).toHaveBeenCalledTimes(1);
      });

      it('should call onChange on space', async () => {
        const onChange = jest.fn();
        const { queryByRole } = render(
          <ShowHideToggle
            id="example"
            ariaLabelHidden="hidden"
            ariaLabelShown="shown"
            shown
            onChange={onChange}
          />,
        );
        queryByRole('checkbox').focus();
        await userEvent.keyboard('[Space]');

        expect(onChange).toHaveBeenCalledTimes(1);
      });
    });

    describe('hidden', () => {
      it('should call onChange when clicked', async () => {
        const onChange = jest.fn();
        const { queryByRole } = render(
          <ShowHideToggle
            id="example"
            ariaLabelHidden="hidden"
            ariaLabelShown="shown"
            shown={false}
            onChange={onChange}
          />,
        );
        await userEvent.click(queryByRole('checkbox'));

        expect(onChange).toHaveBeenCalledTimes(1);
      });

      it('should call onChange on space', async () => {
        const onChange = jest.fn();
        const { queryByRole } = render(
          <ShowHideToggle
            id="example"
            ariaLabelHidden="hidden"
            ariaLabelShown="shown"
            shown={false}
            onChange={onChange}
          />,
        );
        queryByRole('checkbox').focus();
        await userEvent.keyboard('[Space]');

        expect(onChange).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('disabled', () => {
    it('should show checkbox as disabled', () => {
      const onChange = jest.fn();
      const { queryByRole } = render(
        <ShowHideToggle
          id="example"
          ariaLabelHidden="hidden"
          ariaLabelShown="shown"
          shown
          disabled
          onChange={onChange}
        />,
      );

      expect(queryByRole('checkbox')).toBeDisabled();
    });

    it('should be accessible', () => {
      const onChange = jest.fn();
      const { queryByRole } = render(
        <ShowHideToggle
          id="example"
          ariaLabelHidden="hidden"
          ariaLabelShown="shown"
          shown
          disabled
          onChange={onChange}
        />,
      );

      expect(isInaccessible(queryByRole('checkbox'))).toBeFalsy();
    });

    describe('shown', () => {
      it('should not call onChange when clicked', async () => {
        const onChange = jest.fn();
        const { queryByRole } = render(
          <ShowHideToggle
            id="example"
            ariaLabelHidden="hidden"
            ariaLabelShown="shown"
            shown
            disabled
            onChange={onChange}
          />,
        );
        await userEvent.click(queryByRole('checkbox'));

        expect(onChange).not.toHaveBeenCalled();
      });

      it('should not call onChange on space', async () => {
        const onChange = jest.fn();
        const { queryByRole } = render(
          <ShowHideToggle
            id="example"
            ariaLabelHidden="hidden"
            ariaLabelShown="shown"
            shown
            disabled
            onChange={onChange}
          />,
        );
        queryByRole('checkbox').focus();
        await userEvent.keyboard('[Space]');

        expect(onChange).not.toHaveBeenCalled();
      });
    });

    describe('hidden', () => {
      it('should not call onChange when clicked', async () => {
        const onChange = jest.fn();
        const { queryByRole } = render(
          <ShowHideToggle
            id="example"
            ariaLabelHidden="hidden"
            ariaLabelShown="shown"
            shown={false}
            disabled
            onChange={onChange}
          />,
        );
        await userEvent.click(queryByRole('checkbox'));

        expect(onChange).not.toHaveBeenCalled();
      });

      it('should not call onChange on space', async () => {
        const onChange = jest.fn();
        const { queryByRole } = render(
          <ShowHideToggle
            id="example"
            ariaLabelHidden="hidden"
            ariaLabelShown="shown"
            shown={false}
            disabled
            onChange={onChange}
          />,
        );
        queryByRole('checkbox').focus();
        await userEvent.keyboard('[Space]');

        expect(onChange).not.toHaveBeenCalled();
      });
    });
  });
});
