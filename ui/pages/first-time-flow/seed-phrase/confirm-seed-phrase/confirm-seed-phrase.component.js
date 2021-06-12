import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Button from '../../../../components/ui/button';
import {
  INITIALIZE_END_OF_FLOW_ROUTE,
  INITIALIZE_SEED_PHRASE_ROUTE,
} from '../../../../helpers/constants/routes';
import { exportAsFile } from '../../../../helpers/utils/util';
import DraggableSeed from './draggable-seed.component';

const EMPTY_SEEDS = Array(12).fill(null);

export default class ConfirmSeedPhrase extends PureComponent {
  static contextTypes = {
    metricsEvent: PropTypes.func,
    t: PropTypes.func,
  };

  static defaultProps = {
    seedPhrase: '',
  };

  static propTypes = {
    history: PropTypes.object,
    seedPhrase: PropTypes.string,
    initializeThreeBox: PropTypes.func,
    setSeedPhraseBackedUp: PropTypes.func,
  };

  state = {
    selectedSeedIndices: [],
    sortedSeedWords: [],
    pendingSeedIndices: [],
    draggingSeedIndex: -1,
    hoveringIndex: -1,
  };

  componentDidMount() {
    const { seedPhrase = '' } = this.props;
    const sortedSeedWords = (seedPhrase.split(' ') || []).sort();
    this.setState({ sortedSeedWords });
  }

  setDraggingSeedIndex = (draggingSeedIndex) =>
    this.setState({ draggingSeedIndex });

  setHoveringIndex = (hoveringIndex) => this.setState({ hoveringIndex });

  onDrop = (targetIndex) => {
    const { selectedSeedIndices, draggingSeedIndex } = this.state;

    const indices = insert(
      selectedSeedIndices,
      draggingSeedIndex,
      targetIndex,
      true,
    );

    this.setState({
      selectedSeedIndices: indices,
      pendingSeedIndices: indices,
      draggingSeedIndex: -1,
      hoveringIndex: -1,
    });
  };

  handleExport = () => {
    exportAsFile('', this.props.seedPhrase, 'text/plain');
  };

  handleSubmit = async () => {
    const { history, setSeedPhraseBackedUp, initializeThreeBox } = this.props;

    if (!this.isValid()) {
      return;
    }

    try {
      this.context.metricsEvent({
        eventOpts: {
          category: 'Onboarding',
          action: 'Seed Phrase Setup',
          name: 'Verify Complete',
        },
      });

      setSeedPhraseBackedUp(true).then(async () => {
        initializeThreeBox();
        history.push(INITIALIZE_END_OF_FLOW_ROUTE);
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  handleSelectSeedWord = (index) => {
    this.setState({
      selectedSeedIndices: [...this.state.selectedSeedIndices, index],
      pendingSeedIndices: [...this.state.pendingSeedIndices, index],
    });
  };

  handleDeselectSeedWord = (index) => {
    this.setState({
      selectedSeedIndices: this.state.selectedSeedIndices.filter(
        (i) => index !== i,
      ),
      pendingSeedIndices: this.state.pendingSeedIndices.filter(
        (i) => index !== i,
      ),
    });
  };

  isValid() {
    const { seedPhrase } = this.props;
    const { selectedSeedIndices, sortedSeedWords } = this.state;
    const selectedSeedWords = selectedSeedIndices.map(
      (i) => sortedSeedWords[i],
    );
    return seedPhrase === selectedSeedWords.join(' ');
  }

  render() {
    const { t } = this.context;
    const { history } = this.props;
    const {
      selectedSeedIndices,
      sortedSeedWords,
      draggingSeedIndex,
    } = this.state;

    return (
      <div className="confirm-seed-phrase">
        <div className="confirm-seed-phrase__back-button">
          <a
            onClick={(e) => {
              e.preventDefault();
              history.push(INITIALIZE_SEED_PHRASE_ROUTE);
            }}
            href="#"
          >
            {`< ${t('back')}`}
          </a>
        </div>
        <div className="first-time-flow__header">
          {t('confirmSecretBackupPhrase')}
        </div>
        <div className="first-time-flow__text-block">
          {t('selectEachPhrase')}
        </div>
        <div
          className={classnames('confirm-seed-phrase__selected-seed-words', {
            'confirm-seed-phrase__selected-seed-words--dragging':
              draggingSeedIndex > -1,
          })}
        >
          {this.renderPendingSeeds()}
          {this.renderSelectedSeeds()}
        </div>
        <div
          className="confirm-seed-phrase__sorted-seed-words"
          data-testid="seed-phrase-sorted"
        >
          {sortedSeedWords.map((word, index) => {
            const isSelected = selectedSeedIndices.includes(index);

            return (
              <DraggableSeed
                key={index}
                seedIndex={index}
                index={index}
                setHoveringIndex={this.setHoveringIndex}
                onDrop={this.onDrop}
                className="confirm-seed-phrase__seed-word--sorted"
                selected={isSelected}
                onClick={() => {
                  if (isSelected) {
                    this.handleDeselectSeedWord(index);
                  } else {
                    this.handleSelectSeedWord(index);
                  }
                }}
                word={word}
              />
            );
          })}
        </div>
        <Button
          type="primary"
          className="first-time-flow__button"
          onClick={this.handleSubmit}
          disabled={!this.isValid()}
        >
          {t('confirm')}
        </Button>
      </div>
    );
  }

  renderSelectedSeeds() {
    const {
      sortedSeedWords,
      selectedSeedIndices,
      draggingSeedIndex,
    } = this.state;
    return EMPTY_SEEDS.map((_, index) => {
      const seedIndex = selectedSeedIndices[index];
      const word = sortedSeedWords[seedIndex];

      return (
        <DraggableSeed
          key={`selected-${seedIndex}-${index}`}
          className="confirm-seed-phrase__selected-seed-words__selected-seed"
          index={index}
          seedIndex={seedIndex}
          word={word}
          draggingSeedIndex={draggingSeedIndex}
          setDraggingSeedIndex={this.setDraggingSeedIndex}
          setHoveringIndex={this.setHoveringIndex}
          onDrop={this.onDrop}
          draggable
        />
      );
    });
  }

  renderPendingSeeds() {
    const {
      pendingSeedIndices,
      sortedSeedWords,
      draggingSeedIndex,
      hoveringIndex,
    } = this.state;

    const indices = insert(
      pendingSeedIndices,
      draggingSeedIndex,
      hoveringIndex,
    );

    return EMPTY_SEEDS.map((_, index) => {
      const seedIndex = indices[index];
      const word = sortedSeedWords[seedIndex];

      return (
        <DraggableSeed
          key={`pending-${seedIndex}-${index}`}
          index={index}
          className={classnames(
            'confirm-seed-phrase__selected-seed-words__pending-seed',
            {
              'confirm-seed-phrase__seed-word--hidden':
                draggingSeedIndex === seedIndex && index !== hoveringIndex,
            },
          )}
          seedIndex={seedIndex}
          word={word}
          draggingSeedIndex={draggingSeedIndex}
          setDraggingSeedIndex={this.setDraggingSeedIndex}
          setHoveringIndex={this.setHoveringIndex}
          onDrop={this.onDrop}
          droppable={Boolean(word)}
        />
      );
    });
  }
}

function insert(list, value, target, removeOld) {
  let nextList = [...list];

  if (typeof list[target] === 'number') {
    nextList = [...list.slice(0, target), value, ...list.slice(target)];
  }

  if (removeOld) {
    nextList = nextList.filter((seed, i) => {
      return seed !== value || i === target;
    });
  }

  return nextList;
}
