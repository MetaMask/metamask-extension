import * as React from 'react';
import { render } from '@testing-library/react';
import { ContainerMaxWidth } from './container.types';
import { Container } from '.';

describe('Container', () => {
  it('should render the Container without crashing', () => {
    const { container } = render(
      <Container maxWidth={ContainerMaxWidth.Lg}> Test</Container>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render the Container with additional className', () => {
    const { getByTestId } = render(
      <Container data-testid="classname" className="mm-test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-container mm-test');
  });

  it('should render the Container sizes', () => {
    const { getByTestId } = render(
      <>
        <Container
          data-testid={ContainerMaxWidth.Sm}
          maxWidth={ContainerMaxWidth.Sm}
        >
          Small breakpoint: Lorem ipsum dolor sit amet, consectetur adipiscing
          elit. Nullam aliquam, nisl eget aliquam ultrices, nunc nunc aliquam
          nunc, vitae aliquam nunc nunc eget nunc. Nullam aliquam, nisl eget
          aliquam ultrices, nunc nunc aliquam nunc, vitae aliquam nunc nunc eget
          nunc.
        </Container>
        <Container
          data-testid={ContainerMaxWidth.Md}
          maxWidth={ContainerMaxWidth.Md}
        >
          Medium breakpoint: Lorem ipsum dolor sit amet, consectetur adipiscing
          elit. Nullam aliquam, nisl eget aliquam ultrices, nunc nunc aliquam
          nunc, vitae aliquam nunc nunc eget nunc. Nullam aliquam, nisl eget
          aliquam ultrices, nunc nunc aliquam nunc, vitae aliquam nunc nunc eget
          nunc.
        </Container>
        <Container
          data-testid={ContainerMaxWidth.Lg}
          maxWidth={ContainerMaxWidth.Lg}
        >
          Large breakpoint: Lorem ipsum dolor sit amet, consectetur adipiscing
          elit. Nullam aliquam, nisl eget aliquam ultrices, nunc nunc aliquam
          nunc, vitae aliquam nunc nunc eget nunc. Nullam aliquam, nisl eget
          aliquam ultrices, nunc nunc aliquam nunc, vitae aliquam nunc nunc eget
          nunc.
        </Container>
      </>,
    );
    expect(getByTestId(ContainerMaxWidth.Sm)).toHaveClass(
      `mm-container--max-width-${ContainerMaxWidth.Sm}`,
    );
    expect(getByTestId(ContainerMaxWidth.Md)).toHaveClass(
      `mm-container--max-width-${ContainerMaxWidth.Md}`,
    );
    expect(getByTestId(ContainerMaxWidth.Lg)).toHaveClass(
      `mm-container--max-width-${ContainerMaxWidth.Lg}`,
    );
  });
});
