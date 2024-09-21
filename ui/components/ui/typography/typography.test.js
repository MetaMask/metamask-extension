import * as React from 'react';
import { render } from '@testing-library/react';
import Typography from '.';

describe('Typography', () => {
  it('should render the Typography without crashing', () => {
    const { getByText } = render(<Typography>Test type</Typography>);
    expect(getByText('Test type')).toBeDefined();
  });
  it('should render the Typography with correct html elements', () => {
    const { getByText, container } = render(
      <>
        <Typography as="p">p</Typography>
        <Typography as="h1">h1</Typography>
        <Typography as="h2">h2</Typography>
        <Typography as="h3">h3</Typography>
        <Typography as="h4">h4</Typography>
        <Typography as="h5">h5</Typography>
        <Typography as="h6">h6</Typography>
        <Typography as="span">span</Typography>
        <Typography as="strong">strong</Typography>
        <Typography as="em">em</Typography>
        <Typography as="li">li</Typography>
        <Typography as="div">div</Typography>
        <Typography as="dt">dt</Typography>
        <Typography as="dd">dd</Typography>
        <Typography as="label">label</Typography>
      </>,
    );
    expect(container.querySelector('p')).toBeDefined();
    expect(getByText('p')).toBeDefined();
    expect(container.querySelector('h1')).toBeDefined();
    expect(getByText('h1')).toBeDefined();
    expect(container.querySelector('h2')).toBeDefined();
    expect(getByText('h2')).toBeDefined();
    expect(container.querySelector('h3')).toBeDefined();
    expect(getByText('h3')).toBeDefined();
    expect(container.querySelector('h4')).toBeDefined();
    expect(getByText('h4')).toBeDefined();
    expect(container.querySelector('h5')).toBeDefined();
    expect(getByText('h5')).toBeDefined();
    expect(container.querySelector('h6')).toBeDefined();
    expect(getByText('h6')).toBeDefined();
    expect(container.querySelector('span')).toBeDefined();
    expect(getByText('span')).toBeDefined();
    expect(container.querySelector('strong')).toBeDefined();
    expect(getByText('strong')).toBeDefined();
    expect(container.querySelector('em')).toBeDefined();
    expect(getByText('em')).toBeDefined();
    expect(container.querySelector('li')).toBeDefined();
    expect(getByText('li')).toBeDefined();
    expect(container.querySelector('div')).toBeDefined();
    expect(getByText('div')).toBeDefined();
    expect(container.querySelector('dt')).toBeDefined();
    expect(getByText('dt')).toBeDefined();
    expect(container.querySelector('dd')).toBeDefined();
    expect(getByText('dd')).toBeDefined();
    expect(container.querySelector('label')).toBeDefined();
    expect(getByText('label')).toBeDefined();
  });
});
