import React from 'react';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import enLocale from '../../../../app/_locales/en/messages.json';
import { renderWithLocalization } from '../../../../test/lib/render-helpers';
import SrpInput from '.';

const tooFewWords = new Array(11).fill('test').join(' ');
const tooManyWords = new Array(25).fill('test').join(' ');
const invalidWordCount = new Array(13).fill('test').join(' ');
const invalidChecksum = new Array(12).fill('test').join(' ');
const invalidWordCorrectChecksum = `aardvark ${new Array(10)
  .fill('test')
  .join(' ')} wolf`;
const correct = `${new Array(11).fill('test').join(' ')} ball`;

const invalidInputs = [
  tooFewWords,
  invalidWordCount,
  invalidChecksum,
  invalidWordCorrectChecksum,
];

const poorlyFormattedInputs = [
  ` ${correct}`,
  `\t${correct}`,
  `\n${correct}`,
  `${correct} `,
  `${correct}\t`,
  `${correct}\n`,
  `${new Array(11).fill('test').join('  ')}  ball`,
  `${new Array(11).fill('test').join('\t')}\tball`,
];

const whitespaceCharacters = [' ', '  ', '\n', '\t'];

describe('srp-input', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('onChange event', () => {
    it('should not fire event on render', async () => {
      const onChange = jest.fn();

      const { getByText } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      await waitFor(() => getByText(enLocale.secretRecoveryPhrase.message));

      expect(onChange).not.toHaveBeenCalled();
    });

    describe('invalid typed inputs', () => {
      it('should fire event with empty string when only first field is filled out', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.keyboard('test');

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string when one field is empty', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        for (const index of new Array(11).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard('test');
        }

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string when one field has two words', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        for (const index of new Array(11).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(index === 0 ? 'test test' : 'test');
        }
        getByTestId(`import-srp__srp-word-11`).focus();
        await userEvent.keyboard('ball');

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string when one field has two words and one is empty', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        for (const index of new Array(10).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(index === 0 ? 'test test' : 'test');
        }
        getByTestId(`import-srp__srp-word-11`).focus();
        await userEvent.keyboard('ball');

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string if SRP has invalid checksum', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        const srpParts = invalidChecksum.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string if SRP has invalid word', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        const srpParts = invalidWordCorrectChecksum.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string if SRP was valid, then a word was removed', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }
        await userEvent.clear(getByTestId('import-srp__srp-word-0'));

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string if SRP was valid, then was changed to invalidate the checksum', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }
        await userEvent.clear(getByTestId('import-srp__srp-word-0'));
        getByTestId(`import-srp__srp-word-0`).focus();
        await userEvent.keyboard('ball');

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string if valid SRP is pasted, then replaced with an SRP with an invalid word', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste(correct);
        const srpParts = invalidWordCorrectChecksum.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }

        expect(onChange).toHaveBeenLastCalledWith('');
      });
    });

    describe('invalid individually pasted inputs', () => {
      it('should fire event with empty string when only first field is filled out', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste('test');

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string when one field is empty', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        for (const index of new Array(11).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste('test');
        }

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string if SRP has invalid checksum', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        const srpParts = invalidChecksum.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);
        }

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string if SRP has invalid word', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        const srpParts = invalidWordCorrectChecksum.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);
        }

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string if SRP was valid, then a word was removed', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);
        }
        await userEvent.clear(getByTestId('import-srp__srp-word-0'));

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string if SRP was valid, then was changed to invalidate the checksum', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }
        await userEvent.clear(getByTestId('import-srp__srp-word-0'));
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste('ball');

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it('should fire event with empty string if valid SRP is pasted, then replaced with an SRP with an invalid word', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );

        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste(correct);
        const srpParts = invalidWordCorrectChecksum.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);
        }

        expect(onChange).toHaveBeenLastCalledWith('');
      });
    });

    describe('invalid pasted inputs', () => {
      it(`should fire event with empty string upon invalid pasted input: 'test'`, async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste('test');

        expect(onChange).toHaveBeenLastCalledWith('');
      });

      it(`should not fire any event when pasted contents includes >24 words`, async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste(tooManyWords);

        expect(onChange).not.toHaveBeenCalled();
      });

      for (const invalidInput of invalidInputs) {
        it(`should fire event with empty string upon invalid pasted input: '${invalidInput}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          getByTestId('import-srp__srp-word-0').focus();
          await userEvent.paste(invalidInput);

          expect(onChange).toHaveBeenLastCalledWith('');
        });

        it(`should fire event with empty string upon invalid input pasted into second field: '${invalidInput}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          getByTestId('import-srp__srp-word-1').focus();
          await userEvent.paste(invalidInput);

          expect(onChange).toHaveBeenLastCalledWith('');
        });

        it(`should fire event with empty string after replacing valid SRP with: '${invalidInput}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          getByTestId('import-srp__srp-word-1').focus();
          await userEvent.paste(correct);
          await userEvent.paste(invalidInput);

          expect(onChange).toHaveBeenLastCalledWith('');
        });
      }

      it('should fire with empty string when full valid SRP is replaced by prefix', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-1').focus();
        await userEvent.paste(correct);
        await userEvent.paste('test test');

        expect(onChange).toHaveBeenLastCalledWith('');
      });
    });

    describe('valid typed inputs', () => {
      it('should fire event with a valid SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }

        expect(onChange).toHaveBeenLastCalledWith(correct);
      });

      for (const whitespaceCharacter of whitespaceCharacters) {
        it(`should fire event with a valid SRP preceded by a '${whitespaceCharacter}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          const srpParts = correct.split(' ');
          for (const index of new Array(srpParts.length).keys()) {
            getByTestId(`import-srp__srp-word-${index}`).focus();
            await userEvent.keyboard(
              index === 0
                ? `${whitespaceCharacter}${srpParts[index]}`
                : srpParts[index],
            );
          }

          expect(onChange).toHaveBeenLastCalledWith(correct);
        });

        it(`should fire event with a valid SRP followed by a '${whitespaceCharacter}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          const srpParts = correct.split(' ');
          for (const index of new Array(srpParts.length).keys()) {
            getByTestId(`import-srp__srp-word-${index}`).focus();
            await userEvent.keyboard(
              index === 11
                ? `${srpParts[index]}${whitespaceCharacter}`
                : srpParts[index],
            );
          }

          expect(onChange).toHaveBeenLastCalledWith(correct);
        });

        it(`should fire event with a valid SRP where each word is followed by a'${whitespaceCharacter}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          const srpParts = correct.split(' ');
          for (const index of new Array(srpParts.length).keys()) {
            getByTestId(`import-srp__srp-word-${index}`).focus();
            await userEvent.keyboard(
              `${srpParts[index]}${whitespaceCharacter}`,
            );
          }

          expect(onChange).toHaveBeenLastCalledWith(correct);
        });
      }
    });

    describe('valid individually pasted inputs', () => {
      it('should fire event with a valid SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);
        }

        expect(onChange).toHaveBeenLastCalledWith(correct);
      });

      it('should fire event with a valid SRP when each word is pasted in two parts', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index].slice(0, 2));
          await userEvent.paste(srpParts[index].slice(2));
        }

        expect(onChange).toHaveBeenLastCalledWith(correct);
      });

      for (const whitespaceCharacter of whitespaceCharacters) {
        it(`should fire event with a valid SRP preceded by a '${whitespaceCharacter}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          const srpParts = correct.split(' ');
          for (const index of new Array(srpParts.length).keys()) {
            getByTestId(`import-srp__srp-word-${index}`).focus();
            await userEvent.paste(
              index === 0
                ? `${whitespaceCharacter}${srpParts[index]}`
                : srpParts[index],
            );
          }

          expect(onChange).toHaveBeenLastCalledWith(correct);
        });

        it(`should fire event with a valid SRP followed by a '${whitespaceCharacter}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          const srpParts = correct.split(' ');
          for (const index of new Array(srpParts.length).keys()) {
            getByTestId(`import-srp__srp-word-${index}`).focus();
            await userEvent.paste(
              index === 11
                ? `${srpParts[index]}${whitespaceCharacter}`
                : srpParts[index],
            );
          }

          expect(onChange).toHaveBeenLastCalledWith(correct);
        });

        it(`should fire event with a valid SRP where each word is followed by a'${whitespaceCharacter}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          const srpParts = correct.split(' ');
          for (const index of new Array(srpParts.length).keys()) {
            getByTestId(`import-srp__srp-word-${index}`).focus();
            await userEvent.paste(`${srpParts[index]}${whitespaceCharacter}`);
          }

          expect(onChange).toHaveBeenLastCalledWith(correct);
        });
      }
    });

    describe('valid pasted inputs', () => {
      it('should fire event with a valid SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste(correct);

        expect(onChange).toHaveBeenLastCalledWith(correct);
      });

      it('should fire event with a valid SRP when replacing invalid SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste(invalidChecksum);
        await userEvent.paste(correct);

        expect(onChange).toHaveBeenLastCalledWith(correct);
      });

      for (const poorlyFormattedInput of poorlyFormattedInputs) {
        it(`should fire with formatted SRP when given poorly formatted valid SRP: '${poorlyFormattedInput}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          getByTestId('import-srp__srp-word-0').focus();
          await userEvent.paste(poorlyFormattedInput);

          expect(onChange).toHaveBeenLastCalledWith(correct);
        });

        it(`should fire with formatted SRP when poorly formatted valid SRP is pasted into second field: '${poorlyFormattedInput}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          getByTestId('import-srp__srp-word-1').focus();
          await userEvent.paste(poorlyFormattedInput);

          expect(onChange).toHaveBeenLastCalledWith(correct);
        });
      }
    });
  });

  describe('SRP validation error', () => {
    it('should not show error for empty input', async () => {
      const onChange = jest.fn();

      const { getByText, queryByText } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      await waitFor(() => getByText(enLocale.secretRecoveryPhrase.message));

      expect(
        queryByText(enLocale.seedPhraseReq.message),
      ).not.toBeInTheDocument();
      expect(
        queryByText(enLocale.invalidSeedPhrase.message),
      ).not.toBeInTheDocument();
    });

    describe('typed', () => {
      it('should show word requirement error if SRP has too few words', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = tooFewWords.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }

        expect(queryByText(enLocale.seedPhraseReq.message)).toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).not.toBeInTheDocument();
      });

      it('should show word requirement error if SRP has an unsupported word count above 12 but below 24', async () => {
        const onChange = jest.fn();

        const { getByRole, getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        await userEvent.selectOptions(getByRole('combobox'), '15');
        const srpParts = invalidWordCount.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }

        expect(queryByText(enLocale.seedPhraseReq.message)).toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).not.toBeInTheDocument();
      });

      it('should show invalid SRP error if SRP is correct length but has an invalid checksum', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = invalidChecksum.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }

        expect(
          queryByText(enLocale.seedPhraseReq.message),
        ).not.toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).toBeInTheDocument();
      });

      it('should show invalid SRP error if SRP is correct length and has correct checksum but has an invalid word', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = invalidWordCorrectChecksum.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }

        expect(
          queryByText(enLocale.seedPhraseReq.message),
        ).not.toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).toBeInTheDocument();
      });

      it('should not show error for valid SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }

        expect(
          queryByText(enLocale.seedPhraseReq.message),
        ).not.toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).not.toBeInTheDocument();
      });

      for (const whitespaceCharacter of whitespaceCharacters) {
        it(`should not show error for a valid SRP preceded by a '${whitespaceCharacter}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId, queryByText } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          const srpParts = correct.split(' ');
          for (const index of new Array(srpParts.length).keys()) {
            getByTestId(`import-srp__srp-word-${index}`).focus();
            await userEvent.keyboard(
              index === 0
                ? `${whitespaceCharacter}${srpParts[index]}`
                : srpParts[index],
            );
          }

          expect(
            queryByText(enLocale.seedPhraseReq.message),
          ).not.toBeInTheDocument();
          expect(
            queryByText(enLocale.invalidSeedPhrase.message),
          ).not.toBeInTheDocument();
        });

        it(`should not show error for a valid SRP followed by a '${whitespaceCharacter}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId, queryByText } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          const srpParts = correct.split(' ');
          for (const index of new Array(srpParts.length).keys()) {
            getByTestId(`import-srp__srp-word-${index}`).focus();
            await userEvent.keyboard(
              index === 11
                ? `${srpParts[index]}${whitespaceCharacter}`
                : srpParts[index],
            );
          }

          expect(
            queryByText(enLocale.seedPhraseReq.message),
          ).not.toBeInTheDocument();
          expect(
            queryByText(enLocale.invalidSeedPhrase.message),
          ).not.toBeInTheDocument();
        });

        it(`should not show error for a valid SRP where each word is followed by a'${whitespaceCharacter}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId, queryByText } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          const srpParts = correct.split(' ');
          for (const index of new Array(srpParts.length).keys()) {
            getByTestId(`import-srp__srp-word-${index}`).focus();
            await userEvent.keyboard(
              `${srpParts[index]}${whitespaceCharacter}`,
            );
          }

          expect(
            queryByText(enLocale.seedPhraseReq.message),
          ).not.toBeInTheDocument();
          expect(
            queryByText(enLocale.invalidSeedPhrase.message),
          ).not.toBeInTheDocument();
        });
      }
    });

    describe('individually pasted', () => {
      it('should show word requirement error if SRP has too few words', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = tooFewWords.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);
        }

        expect(queryByText(enLocale.seedPhraseReq.message)).toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).not.toBeInTheDocument();
      });

      it('should show word requirement error if SRP has an unsupported word count above 12 but below 24', async () => {
        const onChange = jest.fn();

        const { getByTestId, getByRole, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        await userEvent.selectOptions(getByRole('combobox'), '15');
        const srpParts = invalidWordCount.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);
        }

        expect(queryByText(enLocale.seedPhraseReq.message)).toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).not.toBeInTheDocument();
      });

      it('should show invalid SRP error if SRP is correct length but has an invalid checksum', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = invalidChecksum.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);
        }

        expect(
          queryByText(enLocale.seedPhraseReq.message),
        ).not.toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).toBeInTheDocument();
      });

      it('should show invalid SRP error if SRP is correct length and has correct checksum but has an invalid word', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = invalidWordCorrectChecksum.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);
        }

        expect(
          queryByText(enLocale.seedPhraseReq.message),
        ).not.toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).toBeInTheDocument();
      });

      it('should not show error for valid SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);
        }

        expect(
          queryByText(enLocale.seedPhraseReq.message),
        ).not.toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).not.toBeInTheDocument();
      });

      for (const whitespaceCharacter of whitespaceCharacters) {
        it(`should not show error for a valid SRP preceded by a '${whitespaceCharacter}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId, queryByText } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          const srpParts = correct.split(' ');
          for (const index of new Array(srpParts.length).keys()) {
            getByTestId(`import-srp__srp-word-${index}`).focus();
            await userEvent.paste(
              index === 0
                ? `${whitespaceCharacter}${srpParts[index]}`
                : srpParts[index],
            );
          }

          expect(
            queryByText(enLocale.seedPhraseReq.message),
          ).not.toBeInTheDocument();
          expect(
            queryByText(enLocale.invalidSeedPhrase.message),
          ).not.toBeInTheDocument();
        });

        it(`should not show error for a valid SRP followed by a '${whitespaceCharacter}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId, queryByText } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          const srpParts = correct.split(' ');
          for (const index of new Array(srpParts.length).keys()) {
            getByTestId(`import-srp__srp-word-${index}`).focus();
            await userEvent.paste(
              index === 11
                ? `${srpParts[index]}${whitespaceCharacter}`
                : srpParts[index],
            );
          }

          expect(
            queryByText(enLocale.seedPhraseReq.message),
          ).not.toBeInTheDocument();
          expect(
            queryByText(enLocale.invalidSeedPhrase.message),
          ).not.toBeInTheDocument();
        });

        it(`should not show error for a valid SRP where each word is followed by a'${whitespaceCharacter}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId, queryByText } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          const srpParts = correct.split(' ');
          for (const index of new Array(srpParts.length).keys()) {
            getByTestId(`import-srp__srp-word-${index}`).focus();
            await userEvent.paste(`${srpParts[index]}${whitespaceCharacter}`);
          }

          expect(
            queryByText(enLocale.seedPhraseReq.message),
          ).not.toBeInTheDocument();
          expect(
            queryByText(enLocale.invalidSeedPhrase.message),
          ).not.toBeInTheDocument();
        });
      }
    });

    describe('pasted', () => {
      it('should show word requirement error if SRP has too few words', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste(tooFewWords);

        expect(queryByText(enLocale.seedPhraseReq.message)).toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).not.toBeInTheDocument();
      });

      it('should show word requirement error if SRP has an unsupported word count above 12 but below 24', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste(invalidWordCount);

        expect(queryByText(enLocale.seedPhraseReq.message)).toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).not.toBeInTheDocument();
      });

      it('should show invalid SRP error if SRP is correct length but has an invalid checksum', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste(invalidChecksum);

        expect(
          queryByText(enLocale.seedPhraseReq.message),
        ).not.toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).toBeInTheDocument();
      });

      it('should show invalid SRP error if SRP is correct length and has correct checksum but has an invalid word', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste(invalidWordCorrectChecksum);

        expect(
          queryByText(enLocale.seedPhraseReq.message),
        ).not.toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).toBeInTheDocument();
      });

      it('should not show error for valid SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryByText } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste(correct);

        expect(
          queryByText(enLocale.seedPhraseReq.message),
        ).not.toBeInTheDocument();
        expect(
          queryByText(enLocale.invalidSeedPhrase.message),
        ).not.toBeInTheDocument();
      });

      for (const poorlyFormattedInput of poorlyFormattedInputs) {
        it(`should not show error for poorly formatted valid SRP: '${poorlyFormattedInput}'`, async () => {
          const onChange = jest.fn();

          const { getByTestId, queryByText } = renderWithLocalization(
            <SrpInput
              onChange={onChange}
              srpText={enLocale.secretRecoveryPhrase.message}
            />,
          );
          getByTestId('import-srp__srp-word-0').focus();
          await userEvent.paste(poorlyFormattedInput);

          expect(
            queryByText(enLocale.seedPhraseReq.message),
          ).not.toBeInTheDocument();
          expect(
            queryByText(enLocale.invalidSeedPhrase.message),
          ).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Show/hide SRP', () => {
    it('should default to not showing SRP', async () => {
      const onChange = jest.fn();

      const { getByTestId } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );

      for (const index of new Array(12).keys()) {
        expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveAttribute(
          'type',
          'password',
        );
        expect(
          getByTestId(`import-srp__srp-word-${index}-checkbox`),
        ).not.toBeChecked();
      }
    });

    describe('default hidden', () => {
      it('should prevent reading typed SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryAllByRole } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);

          expect(queryAllByRole('textbox')).toHaveLength(0);
        }
      });

      it('should prevent reading individually pasted SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryAllByRole } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);

          expect(queryAllByRole('textbox')).toHaveLength(0);
        }
      });

      it('should prevent reading pasted SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryAllByRole } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste(correct);

        expect(queryAllByRole('textbox')).toHaveLength(0);
      });
    });

    describe('shown then hidden', () => {
      it('should prevent reading typed SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          await userEvent.click(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          );
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
          await userEvent.click(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          );

          expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveAttribute(
            'type',
            'password',
          );
        }
      });

      it('should prevent reading individually pasted SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          await userEvent.click(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          );
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);
          await userEvent.click(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          );

          expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveAttribute(
            'type',
            'password',
          );
        }
      });
    });

    describe('shown after input', () => {
      it('should show words from typed SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);
        }

        for (const index of new Array(srpParts.length).keys()) {
          await userEvent.click(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          );

          expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveAttribute(
            'type',
            'text',
          );
          expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveValue(
            srpParts[index],
          );
          await userEvent.click(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          );
        }
      });

      it('should show words from individually pasted SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);
        }

        for (const index of new Array(srpParts.length).keys()) {
          await userEvent.click(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          );

          expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveAttribute(
            'type',
            'text',
          );
          expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveValue(
            srpParts[index],
          );
          await userEvent.click(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          );
        }
      });

      it('should show words from pasted SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.paste(correct);

        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          await userEvent.click(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          );

          expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveAttribute(
            'type',
            'text',
          );
          expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveValue(
            srpParts[index],
          );
          await userEvent.click(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          );
        }
      });
    });

    describe('shown before input', () => {
      it('should show words from typed SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          await userEvent.click(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          );
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.keyboard(srpParts[index]);

          expect(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          ).toBeChecked();
          expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveAttribute(
            'type',
            'text',
          );
          expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveValue(
            srpParts[index],
          );
        }
      });

      it('should show words from individually pasted SRP', async () => {
        const onChange = jest.fn();

        const { getByTestId } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        const srpParts = correct.split(' ');
        for (const index of new Array(srpParts.length).keys()) {
          await userEvent.click(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          );
          getByTestId(`import-srp__srp-word-${index}`).focus();
          await userEvent.paste(srpParts[index]);

          expect(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          ).toBeChecked();
          expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveAttribute(
            'type',
            'text',
          );
          expect(getByTestId(`import-srp__srp-word-${index}`)).toHaveValue(
            srpParts[index],
          );
        }
      });
    });

    describe('hidden after paste', () => {
      it('should hide all inputs after an incomplete multi-word paste', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryAllByRole } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        await userEvent.click(getByTestId('import-srp__srp-word-0-checkbox'));
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.keyboard('test');
        expect(queryAllByRole('textbox')).toHaveLength(1);

        await userEvent.paste(tooFewWords);
        expect(queryAllByRole('textbox')).toHaveLength(0);
        for (const index of new Array(12).keys()) {
          expect(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          ).not.toBeChecked();
        }
      });

      it('should hide all inputs after a full SRP paste', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryAllByRole } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        await userEvent.click(getByTestId('import-srp__srp-word-0-checkbox'));
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.keyboard('test');
        expect(queryAllByRole('textbox')).toHaveLength(1);

        await userEvent.paste(correct);
        expect(queryAllByRole('textbox')).toHaveLength(0);
        for (const index of new Array(12).keys()) {
          expect(
            getByTestId(`import-srp__srp-word-${index}-checkbox`),
          ).not.toBeChecked();
        }
      });

      it('should not hide inputs after a single word paste', async () => {
        const onChange = jest.fn();

        const { getByTestId, queryAllByRole } = renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
        await userEvent.click(getByTestId('import-srp__srp-word-0-checkbox'));
        getByTestId('import-srp__srp-word-0').focus();
        await userEvent.keyboard('test');
        expect(queryAllByRole('textbox')).toHaveLength(1);

        await userEvent.paste('test');
        expect(queryAllByRole('textbox')).toHaveLength(1);
        expect(getByTestId('import-srp__srp-word-0-checkbox')).toBeChecked();
      });
    });

    it('should hide shown field when another field is shown', async () => {
      const onChange = jest.fn();

      const { getByTestId, queryAllByRole } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(correct);
      await userEvent.click(getByTestId('import-srp__srp-word-0-checkbox'));
      expect(getByTestId('import-srp__srp-word-0-checkbox')).toBeChecked();
      await userEvent.click(getByTestId('import-srp__srp-word-1-checkbox'));

      expect(queryAllByRole('textbox')).toHaveLength(1);
      expect(getByTestId('import-srp__srp-word-0-checkbox')).not.toBeChecked();
      expect(getByTestId('import-srp__srp-word-1-checkbox')).toBeChecked();
    });
  });

  describe('clear after paste', () => {
    it('should not clear clipboard after typing SRP', async () => {
      const onChange = jest.fn();
      const writeTextSpy = jest.spyOn(window.navigator.clipboard, 'writeText');

      const { getByTestId } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      const srpParts = correct.split(' ');
      for (const index of new Array(srpParts.length).keys()) {
        getByTestId(`import-srp__srp-word-${index}`).focus();
        await userEvent.keyboard(srpParts[index]);
      }

      expect(writeTextSpy).not.toHaveBeenCalled();
    });

    it('should not clear the clipboard after individually pasting SRP', async () => {
      const onChange = jest.fn();
      const writeTextSpy = jest.spyOn(window.navigator.clipboard, 'writeText');

      const { getByTestId } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      const srpParts = correct.split(' ');
      for (const index of new Array(srpParts.length).keys()) {
        getByTestId(`import-srp__srp-word-${index}`).focus();
        await userEvent.paste(srpParts[index]);
      }

      expect(writeTextSpy).not.toHaveBeenCalled();
    });

    it('should not clear the clipboard after pasting SRP with too many words', async () => {
      const onChange = jest.fn();
      const writeTextSpy = jest.spyOn(window.navigator.clipboard, 'writeText');

      const { getByTestId } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(tooManyWords);

      expect(writeTextSpy).not.toHaveBeenCalled();
    });

    it('should clear the clipboard after pasting incomplete SRP', async () => {
      const onChange = jest.fn();
      const writeTextSpy = jest.spyOn(window.navigator.clipboard, 'writeText');

      const { getByTestId } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(tooFewWords);

      expect(writeTextSpy).toHaveBeenCalledWith('');
    });

    it('should clear the clipboard after pasting correct SRP', async () => {
      const onChange = jest.fn();
      const writeTextSpy = jest.spyOn(window.navigator.clipboard, 'writeText');

      const { getByTestId } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(correct);

      expect(writeTextSpy).toHaveBeenCalledWith('');
    });
  });

  describe('number of words dropdown', () => {
    it('should default to 12 words', () => {
      const onChange = jest.fn();

      const { queryByTestId, queryByRole } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );

      expect(
        queryByRole('option', {
          name: enLocale.srpInputNumberOfWords.message.replace('$1', '12'),
          selected: true,
        }),
      ).toBeInTheDocument();
      expect(queryByTestId('import-srp__srp-word-11')).toBeInTheDocument();
      expect(queryByTestId('import-srp__srp-word-12')).not.toBeInTheDocument();
    });

    it('should be updated on paste to allow room for a longer SRP', async () => {
      const onChange = jest.fn();

      const { getByTestId, queryByTestId, queryByRole } =
        renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(new Array(15).fill('test').join(' '));

      expect(
        queryByRole('option', {
          name: enLocale.srpInputNumberOfWords.message.replace('$1', '15'),
          selected: true,
        }),
      ).toBeInTheDocument();
      expect(queryByTestId('import-srp__srp-word-14')).toBeInTheDocument();
      expect(queryByTestId('import-srp__srp-word-15')).not.toBeInTheDocument();
    });

    it('should be updated on paste to match the size of a shorter SRP', async () => {
      const onChange = jest.fn();

      const { getByRole, getByTestId, queryByTestId, queryByRole } =
        renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
      await userEvent.selectOptions(getByRole('combobox'), '15');
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(correct);

      expect(
        queryByRole('option', {
          name: enLocale.srpInputNumberOfWords.message.replace('$1', '12'),
          selected: true,
        }),
      ).toBeInTheDocument();
      expect(queryByTestId('import-srp__srp-word-11')).toBeInTheDocument();
      expect(queryByTestId('import-srp__srp-word-12')).not.toBeInTheDocument();
    });

    it('should round up to nearest valid size on paste when SRP has an invalid number of words', async () => {
      const onChange = jest.fn();

      const { getByTestId, queryByTestId, queryByRole } =
        renderWithLocalization(
          <SrpInput
            onChange={onChange}
            srpText={enLocale.secretRecoveryPhrase.message}
          />,
        );
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(invalidWordCount);

      expect(
        queryByRole('option', {
          name: enLocale.srpInputNumberOfWords.message.replace('$1', '15'),
          selected: true,
        }),
      ).toBeInTheDocument();
      expect(queryByTestId('import-srp__srp-word-14')).toBeInTheDocument();
      expect(queryByTestId('import-srp__srp-word-15')).not.toBeInTheDocument();
    });

    it('should update the number of fields', async () => {
      const onChange = jest.fn();

      const { getByRole, queryByTestId, queryByRole } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      await userEvent.selectOptions(getByRole('combobox'), '24');

      expect(
        queryByRole('option', {
          name: enLocale.srpInputNumberOfWords.message.replace('$1', '24'),
          selected: true,
        }),
      ).toBeInTheDocument();
      expect(queryByTestId('import-srp__srp-word-23')).toBeInTheDocument();
      expect(queryByTestId('import-srp__srp-word-24')).not.toBeInTheDocument();
    });

    it('should forget any field state that is no longer shown', async () => {
      const onChange = jest.fn();

      const { getByRole, getByTestId, queryByTestId } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(new Array(15).fill('test').join(' '));
      await userEvent.selectOptions(getByRole('combobox'), '12');
      await userEvent.selectOptions(getByRole('combobox'), '15');

      expect(queryByTestId('import-srp__srp-word-14')).toBeInTheDocument();
      expect(queryByTestId('import-srp__srp-word-15')).not.toBeInTheDocument();
      expect(queryByTestId('import-srp__srp-word-11').value).toBe('test');
      expect(queryByTestId('import-srp__srp-word-12').value).toBe('');
      expect(queryByTestId('import-srp__srp-word-13').value).toBe('');
      expect(queryByTestId('import-srp__srp-word-14').value).toBe('');
    });
  });

  describe('paste error', () => {
    it('should show paste error when too many words are pasted', async () => {
      const onChange = jest.fn();

      const { getByTestId, queryByText } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(tooManyWords);

      expect(
        queryByText(enLocale.srpPasteFailedTooManyWords.message),
      ).toBeInTheDocument();
    });

    it('should allow dismissing the paste error', async () => {
      const onChange = jest.fn();

      const { getByTestId, getByText, queryByText } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(tooManyWords);
      await userEvent.click(getByText('Dismiss'));

      expect(
        queryByText(enLocale.srpPasteFailedTooManyWords.message),
      ).not.toBeInTheDocument();
    });

    it('should dismiss the paste error after paste with fewer than 24 words', async () => {
      const onChange = jest.fn();

      const { getByTestId, queryByText } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(tooManyWords);
      await userEvent.paste(correct);

      expect(
        queryByText(enLocale.srpPasteFailedTooManyWords.message),
      ).not.toBeInTheDocument();
    });

    it('should not dismiss the paste error after a second paste with over 24 words', async () => {
      const onChange = jest.fn();

      const { getByTestId, queryByText } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(tooManyWords);
      await userEvent.paste(tooManyWords);

      expect(
        queryByText(enLocale.srpPasteFailedTooManyWords.message),
      ).toBeInTheDocument();
    });

    it('should dismiss the paste error after typing', async () => {
      const onChange = jest.fn();

      const { getByTestId, queryByText } = renderWithLocalization(
        <SrpInput
          onChange={onChange}
          srpText={enLocale.secretRecoveryPhrase.message}
        />,
      );
      getByTestId('import-srp__srp-word-0').focus();
      await userEvent.paste(tooManyWords);
      await userEvent.keyboard('test');

      expect(
        queryByText(enLocale.srpPasteFailedTooManyWords.message),
      ).not.toBeInTheDocument();
    });
  });
});
