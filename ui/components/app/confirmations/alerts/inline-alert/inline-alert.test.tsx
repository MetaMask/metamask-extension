import * as React from 'react';
import { render } from '@testing-library/react';
import { Severity } from '../../../../../helpers/constants/design-system';
import InlineAlert from './inline-alert';

const onClickMock = jest.fn();

describe('Inline Alert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders alert with danger severity', () => {
    const { container } = render(
      <InlineAlert onClick={onClickMock} severity={Severity.Danger} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders alert with warning severity', () => {
    const { container } = render(
      <InlineAlert onClick={onClickMock} severity={Severity.Warning} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders alert with informative severity', () => {
    const { container } = render(<InlineAlert onClick={onClickMock} />);

    expect(container).toMatchSnapshot();
  });
});
