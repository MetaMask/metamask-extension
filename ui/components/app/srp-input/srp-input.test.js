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
  ' ',
  'foo',
  '🙂',
  tooFewWords,
  tooManyWords,
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

describe('srp-input', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('onChange event', () => {
    it('should not fire event on render', async () => {
      const onChange = jest.fn();

      const { getByLabelText } = renderWithLocalization(
        <SrpInput onChange={onChange} />,
      );
      await waitFor(() => getByLabelText(enLocale.showSeedPhrase.message));

      expect(onChange).not.toHaveBeenCalled();
    });

    describe('invalid typed inputs', () => {
      for (const invalidInput of invalidInputs) {
        it(`should fire event with empty string upon invalid input: '${invalidInput}'`, async () => {
          const onChange = jest.fn();

          const { getByLabelText } = renderWithLocalization(
            <SrpInput onChange={onChange} />,
          );
          getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
          await userEvent.keyboard(invalidInput);

          expect(onChange).toHaveBeenLastCalledWith('');
        });
      }
    });

    describe('invalid pasted inputs', () => {
      for (const invalidInput of invalidInputs) {
        it(`should fire event with empty string upon invalid pasted input: '${invalidInput}'`, async () => {
          const onChange = jest.fn();

          const { getByLabelText } = renderWithLocalization(
            <SrpInput onChange={onChange} />,
          );
          getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
          await userEvent.paste(invalidInput);

          expect(onChange).toHaveBeenLastCalledWith('');
        });
      }
    });

    describe('valid typed inputs', () => {
      it('should fire event with a valid SRP', async () => {
        const onChange = jest.fn();

        const { getByLabelText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.keyboard(correct);

        expect(onChange).toHaveBeenLastCalledWith(correct);
      });

      for (const poorlyFormattedInput of poorlyFormattedInputs) {
        it(`should fire with formatted SRP when given poorly formatted valid SRP: '${poorlyFormattedInput}'`, async () => {
          const onChange = jest.fn();

          const { getByLabelText } = renderWithLocalization(
            <SrpInput onChange={onChange} />,
          );
          getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
          await userEvent.keyboard(poorlyFormattedInput);

          expect(onChange).toHaveBeenLastCalledWith(correct);
        });
      }
    });

    describe('valid pasted inputs', () => {
      it('should fire event with a valid SRP', async () => {
        const onChange = jest.fn();

        const { getByLabelText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.paste(correct);

        expect(onChange).toHaveBeenLastCalledWith(correct);
      });

      for (const poorlyFormattedInput of poorlyFormattedInputs) {
        it(`should fire with formatted SRP when given poorly formatted valid SRP: '${poorlyFormattedInput}'`, async () => {
          const onChange = jest.fn();

          const { getByLabelText } = renderWithLocalization(
            <SrpInput onChange={onChange} />,
          );
          getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
          await userEvent.paste(poorlyFormattedInput);

          expect(onChange).toHaveBeenLastCalledWith(correct);
        });
      }
    });
  });

  describe('error message', () => {
    it('should not show error for empty input', async () => {
      const onChange = jest.fn();

      const { getByLabelText, queryByText } = renderWithLocalization(
        <SrpInput onChange={onChange} />,
      );
      await waitFor(() => getByLabelText(enLocale.showSeedPhrase.message));

      expect(queryByText(enLocale.seedPhraseReq.message)).toBeNull();
      expect(queryByText(enLocale.invalidSeedPhrase.message)).toBeNull();
    });

    describe('typed', () => {
      it('should show word requirement error if SRP has too few words', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.keyboard(tooFewWords);

        expect(queryByText(enLocale.seedPhraseReq.message)).not.toBeNull();
        expect(queryByText(enLocale.invalidSeedPhrase.message)).toBeNull();
      });

      it('should show word requirement error if SRP has too many words', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.keyboard(tooManyWords);

        expect(queryByText(enLocale.seedPhraseReq.message)).not.toBeNull();
        expect(queryByText(enLocale.invalidSeedPhrase.message)).toBeNull();
      });

      it('should show word requirement error if SRP has an unsupported word count above 12 but below 24', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.keyboard(invalidWordCount);

        expect(queryByText(enLocale.seedPhraseReq.message)).not.toBeNull();
        expect(queryByText(enLocale.invalidSeedPhrase.message)).toBeNull();
      });

      it('should show invalid SRP error if SRP is correct length but has an invalid checksum', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.keyboard(invalidChecksum);

        expect(queryByText(enLocale.seedPhraseReq.message)).toBeNull();
        expect(queryByText(enLocale.invalidSeedPhrase.message)).not.toBeNull();
      });

      it('should show invalid SRP error if SRP is correct length and has correct checksum but has an invalid word', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.keyboard(invalidWordCorrectChecksum);

        expect(queryByText(enLocale.seedPhraseReq.message)).toBeNull();
        expect(queryByText(enLocale.invalidSeedPhrase.message)).not.toBeNull();
      });

      it('should not show error for valid SRP', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.keyboard(correct);

        expect(queryByText(enLocale.seedPhraseReq.message)).toBeNull();
        expect(queryByText(enLocale.invalidSeedPhrase.message)).toBeNull();
      });

      for (const poorlyFormattedInput of poorlyFormattedInputs) {
        it(`should not show error for poorly formatted valid SRP: '${poorlyFormattedInput}'`, async () => {
          const onChange = jest.fn();

          const { getByLabelText, queryByText } = renderWithLocalization(
            <SrpInput onChange={onChange} />,
          );
          getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
          await userEvent.keyboard(poorlyFormattedInput);

          expect(queryByText(enLocale.seedPhraseReq.message)).toBeNull();
          expect(queryByText(enLocale.invalidSeedPhrase.message)).toBeNull();
        });
      }
    });

    describe('pasted', () => {
      it('should show word requirement error if SRP has too few words', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.paste(tooFewWords);

        expect(queryByText(enLocale.seedPhraseReq.message)).not.toBeNull();
        expect(queryByText(enLocale.invalidSeedPhrase.message)).toBeNull();
      });

      it('should show word requirement error if SRP has too many words', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.paste(tooManyWords);

        expect(queryByText(enLocale.seedPhraseReq.message)).not.toBeNull();
        expect(queryByText(enLocale.invalidSeedPhrase.message)).toBeNull();
      });

      it('should show word requirement error if SRP has an unsupported word count above 12 but below 24', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.paste(invalidWordCount);

        expect(queryByText(enLocale.seedPhraseReq.message)).not.toBeNull();
        expect(queryByText(enLocale.invalidSeedPhrase.message)).toBeNull();
      });

      it('should show invalid SRP error if SRP is correct length but has an invalid checksum', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.paste(invalidChecksum);

        expect(queryByText(enLocale.seedPhraseReq.message)).toBeNull();
        expect(queryByText(enLocale.invalidSeedPhrase.message)).not.toBeNull();
      });

      it('should show invalid SRP error if SRP is correct length and has correct checksum but has an invalid word', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.paste(invalidWordCorrectChecksum);

        expect(queryByText(enLocale.seedPhraseReq.message)).toBeNull();
        expect(queryByText(enLocale.invalidSeedPhrase.message)).not.toBeNull();
      });

      it('should not show error for valid SRP', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.paste(correct);

        expect(queryByText(enLocale.seedPhraseReq.message)).toBeNull();
        expect(queryByText(enLocale.invalidSeedPhrase.message)).toBeNull();
      });

      for (const poorlyFormattedInput of poorlyFormattedInputs) {
        it(`should not show error for poorly formatted valid SRP: '${poorlyFormattedInput}'`, async () => {
          const onChange = jest.fn();

          const { getByLabelText, queryByText } = renderWithLocalization(
            <SrpInput onChange={onChange} />,
          );
          getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
          await userEvent.paste(poorlyFormattedInput);

          expect(queryByText(enLocale.seedPhraseReq.message)).toBeNull();
          expect(queryByText(enLocale.invalidSeedPhrase.message)).toBeNull();
        });
      }
    });
  });

  describe('Show/hide SRP', () => {
    it('should default to not showing SRP', async () => {
      const onChange = jest.fn();

      const { getByLabelText, getByRole } = renderWithLocalization(
        <SrpInput onChange={onChange} />,
      );

      expect(
        getByLabelText(enLocale.secretRecoveryPhrase.message),
      ).toHaveAttribute('type', 'password');
      expect(getByRole('checkbox')).not.toBeChecked();
    });

    describe('default hidden', () => {
      it('should prevent reading typed SRP', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.keyboard(correct);

        expect(queryByText(correct)).toBeNull();
      });

      it('should prevent reading pasted SRP', async () => {
        const onChange = jest.fn();

        const { getByLabelText, queryByText } = renderWithLocalization(
          <SrpInput onChange={onChange} />,
        );
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.paste(correct);

        expect(queryByText(correct)).toBeNull();
      });
    });

    describe('shown then hidden', () => {
      it('should prevent reading typed SRP', async () => {
        const onChange = jest.fn();

        const {
          getByLabelText,
          getByRole,
          queryByText,
        } = renderWithLocalization(<SrpInput onChange={onChange} />);
        await userEvent.click(getByRole('checkbox'));
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.keyboard(correct);
        await userEvent.click(getByRole('checkbox'));

        expect(queryByText(correct)).toBeNull();
      });

      it('should prevent reading pasted SRP', async () => {
        const onChange = jest.fn();

        const {
          getByLabelText,
          getByRole,
          queryByText,
        } = renderWithLocalization(<SrpInput onChange={onChange} />);
        await userEvent.click(getByRole('checkbox'));
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.paste(correct);
        await userEvent.click(getByRole('checkbox'));

        expect(queryByText(correct)).toBeNull();
      });
    });

    describe('shown after input', () => {
      it('should show typed SRP', async () => {
        const onChange = jest.fn();

        const {
          getByLabelText,
          getByRole,
          queryByText,
        } = renderWithLocalization(<SrpInput onChange={onChange} />);
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.paste(correct);
        await userEvent.click(getByRole('checkbox'));

        expect(queryByText(correct)).not.toBeNull();
      });

      it('should show pasted SRP', async () => {
        const onChange = jest.fn();

        const {
          getByLabelText,
          getByRole,
          queryByText,
        } = renderWithLocalization(<SrpInput onChange={onChange} />);
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.keyboard(correct);
        await userEvent.click(getByRole('checkbox'));

        expect(queryByText(correct)).not.toBeNull();
      });
    });

    describe('shown before input', () => {
      it('should show typed SRP', async () => {
        const onChange = jest.fn();

        const {
          getByLabelText,
          getByRole,
          queryByText,
        } = renderWithLocalization(<SrpInput onChange={onChange} />);
        await userEvent.click(getByRole('checkbox'));
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.paste(correct);

        expect(queryByText(correct)).not.toBeNull();
      });

      it('should show pasted SRP', async () => {
        const onChange = jest.fn();

        const {
          getByLabelText,
          getByRole,
          queryByText,
        } = renderWithLocalization(<SrpInput onChange={onChange} />);
        await userEvent.click(getByRole('checkbox'));
        getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
        await userEvent.keyboard(correct);

        expect(queryByText(correct)).not.toBeNull();
      });
    });
  });

  describe('clear after paste', () => {
    it('should not clear clipboard after typing hidden SRP', async () => {
      const onChange = jest.fn();
      const writeTextSpy = jest.spyOn(window.navigator.clipboard, 'writeText');

      const { getByLabelText } = renderWithLocalization(
        <SrpInput onChange={onChange} />,
      );
      getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
      await userEvent.keyboard(correct);

      expect(writeTextSpy).not.toHaveBeenCalled();
    });

    it('should not clear clipboard after typing shown SRP', async () => {
      const onChange = jest.fn();
      const writeTextSpy = jest.spyOn(window.navigator.clipboard, 'writeText');

      const { getByLabelText, getByRole } = renderWithLocalization(
        <SrpInput onChange={onChange} />,
      );
      await userEvent.click(getByRole('checkbox'));
      getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
      await userEvent.keyboard(correct);

      expect(writeTextSpy).not.toHaveBeenCalled();
    });

    it('should clear the clipboard after pasting hidden SRP', async () => {
      const onChange = jest.fn();
      const writeTextSpy = jest.spyOn(window.navigator.clipboard, 'writeText');

      const { getByLabelText } = renderWithLocalization(
        <SrpInput onChange={onChange} />,
      );
      getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
      await userEvent.paste(correct);

      expect(writeTextSpy).toHaveBeenCalledWith('');
    });

    it('should clear the clipboard after pasting shown SRP', async () => {
      const onChange = jest.fn();
      const writeTextSpy = jest.spyOn(window.navigator.clipboard, 'writeText');

      const { getByLabelText, getByRole } = renderWithLocalization(
        <SrpInput onChange={onChange} />,
      );
      await userEvent.click(getByRole('checkbox'));
      getByLabelText(enLocale.secretRecoveryPhrase.message).focus();
      await userEvent.paste(correct);

      expect(writeTextSpy).toHaveBeenCalledWith('');
    });
  });
});
