import { splitNumericString } from './split-numeric-string';

const CASES: {
  description: string;
  expected: ReturnType<typeof splitNumericString>;
  value: string;
}[] = [
  {
    description: 'a leading currency symbol',
    expected: { prefix: '$ ', numeric: '4500.00', suffix: '' },
    value: '$ 4500.00',
  },
  {
    description: 'a trailing label',
    expected: { prefix: '$ ', numeric: '250.00', suffix: ' available' },
    value: '$ 250.00 available',
  },
  {
    description: 'a trailing ticker',
    expected: { prefix: '', numeric: '0.0025', suffix: ' ETH available' },
    value: '0.0025 ETH available',
  },
  {
    description: 'a ticker containing digits',
    expected: { prefix: '', numeric: '5', suffix: ' 1INCH' },
    value: '5 1INCH',
  },
  {
    description: 'a half-typed trailing decimal',
    expected: { prefix: '', numeric: '12.', suffix: '' },
    value: '12.',
  },
  {
    description: 'a half-typed trailing decimal comma',
    expected: { prefix: '', numeric: '12,', suffix: '' },
    value: '12,',
  },
  {
    description: 'a leading separator',
    expected: { prefix: '.', numeric: '5', suffix: '' },
    value: '.5',
  },
  {
    description: 'grouping spaces',
    expected: { prefix: '', numeric: '1 234.56', suffix: '' },
    value: '1 234.56',
  },
  {
    description: 'non-breaking-space grouping',
    expected: { prefix: '', numeric: '1\u00A0234,56', suffix: '' },
    value: '1\u00A0234,56',
  },
  {
    description: 'narrow-non-breaking-space grouping',
    expected: { prefix: '', numeric: '1\u202F234,56', suffix: '' },
    value: '1\u202F234,56',
  },
  {
    description: 'ASCII apostrophe grouping',
    expected: { prefix: '', numeric: "1'234.56", suffix: '' },
    value: "1'234.56",
  },
  {
    description: 'typographic apostrophe grouping',
    expected: { prefix: '', numeric: '1’234.56', suffix: '' },
    value: '1’234.56',
  },
  {
    description: 'signs and currency symbols',
    expected: { prefix: '-$', numeric: '1,234.56', suffix: '' },
    value: '-$1,234.56',
  },
  {
    description: 'decimal-comma formatting',
    expected: { prefix: '€', numeric: '1.234,56', suffix: '' },
    value: '€1.234,56',
  },
  {
    description: 'text without digits',
    expected: { prefix: '--', numeric: '', suffix: '' },
    value: '--',
  },
  {
    description: 'an empty string',
    expected: { prefix: '', numeric: '', suffix: '' },
    value: '',
  },
  {
    description: 'subscript digits after a decimal',
    expected: { prefix: '$', numeric: '0.0₇5', suffix: '' },
    value: '$0.0₇5',
  },
  {
    description: 'a glued magnitude letter',
    expected: { prefix: '-$', numeric: '1.2M', suffix: '' },
    value: '-$1.2M',
  },
  {
    description: 'a percent suffix',
    expected: { prefix: '+', numeric: '182.00', suffix: '%' },
    value: '+182.00%',
  },
  {
    description: 'a magnitude letter followed by more letters',
    expected: { prefix: '', numeric: '5', suffix: 'METH' },
    value: '5METH',
  },
];

describe('splitNumericString', () => {
  for (const { description, expected, value } of CASES) {
    it(`splits ${description}`, () => {
      expect(splitNumericString(value)).toStrictEqual(expected);
    });
  }
});
