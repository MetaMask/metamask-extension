import {
  Box,
  Text,
  Container,
  Footer,
  Button,
  Input,
} from '@metamask/snaps-sdk/jsx';
import { BackgroundColor } from '../../../../helpers/constants/design-system';
import { renderInterface } from './test-utils';

describe('SnapUIRenderer', () => {
  it('renders loading state', () => {
    const { container } = renderInterface(null);

    expect(container.getElementsByClassName('pulse-loader')).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });

  it('renders basic UI', () => {
    const { container, getByText, getRenderCount } = renderInterface(
      Box({ children: Text({ children: 'Hello world!' }) }),
    );

    expect(getByText('Hello world!')).toBeDefined();
    expect(getRenderCount()).toBe(1);
    expect(container).toMatchSnapshot();
  });

  it('supports the contentBackgroundColor prop', () => {
    const { container } = renderInterface(
      Container({
        children: [
          Box({ children: Text({ children: 'Hello world!' }) }),
          Footer({ children: Button({ children: 'Foo' }) }),
        ],
      }),
      {
        useFooter: true,
        contentBackgroundColor: BackgroundColor.backgroundDefault,
      },
    );

    expect(
      container.getElementsByClassName(
        'mm-box--background-color-background-default',
      ),
    ).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });

  it('supports container backgrounds', () => {
    const { container } = renderInterface(
      Container({
        backgroundColor: 'alternative',
        children: [
          Box({ children: Text({ children: 'Hello world!' }) }),
          Footer({ children: Button({ children: 'Foo' }) }),
        ],
      }),
      {
        useFooter: true,
      },
    );

    expect(
      container.getElementsByClassName(
        'mm-box snap-ui-renderer__content mm-box--background-color-background-default',
      ),
    ).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });

  it('re-renders when the interface changes', () => {
    const { container, getAllByRole, updateInterface, getRenderCount } =
      renderInterface(Box({ children: Input({ name: 'input' }) }));

    const inputs = getAllByRole('textbox');
    expect(inputs).toHaveLength(1);

    updateInterface(
      Box({ children: [Input({ name: 'input' }), Input({ name: 'input2' })] }),
    );

    const inputsAfterRerender = getAllByRole('textbox');
    expect(inputsAfterRerender).toHaveLength(2);

    expect(getRenderCount()).toBe(2);

    expect(container).toMatchSnapshot();
  });

  it('re-syncs state when the interface changes', () => {
    const { container, getAllByRole, getRenderCount, updateInterface } =
      renderInterface(Box({ children: Input({ name: 'input' }) }));

    updateInterface(
      Box({ children: [Input({ name: 'input' }), Input({ name: 'input2' })] }),
      { input: 'bar', input2: 'foo' },
    );

    const inputsAfterRerender = getAllByRole('textbox');
    expect(inputsAfterRerender[0].value).toStrictEqual('bar');
    expect(inputsAfterRerender[1].value).toStrictEqual('foo');

    expect(getRenderCount()).toBe(2);

    expect(container).toMatchSnapshot();
  });
});
