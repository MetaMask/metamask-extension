import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import shuffle from 'lodash.shuffle'
import Button from '../../../../components/ui/button'
import {
  INITIALIZE_END_OF_FLOW_ROUTE,
  INITIALIZE_SEED_PHRASE_ROUTE,
  DEFAULT_ROUTE,
} from '../../../../helpers/constants/routes'
import { exportAsFile } from '../../../../helpers/utils/util'
import DraggableSeed from './draggable-seed.component'

const EMPTY_SEEDS = Array(12).fill(null)

export default class ConfirmSeedPhrase extends PureComponent {
  static contextTypes = {
    metricsEvent: PropTypes.func,
    t: PropTypes.func,
  }

  static defaultProps = {
    seedPhrase: '',
  }

  static propTypes = {
    hideSeedPhraseBackupAfterOnboarding: PropTypes.func,
    history: PropTypes.object,
    seedPhrase: PropTypes.string,
    initializeThreeBox: PropTypes.func,
    setSeedPhraseBackedUp: PropTypes.func,
    showingSeedPhraseBackupAfterOnboarding: PropTypes.bool,
  }

  state = {
    selectedSeedIndices: [],
    shuffledSeedWords: [],
    pendingSeedIndices: [],
    draggingSeedIndex: -1,
    hoveringIndex: -1,
    isDragging: false,
  }

  shouldComponentUpdate (nextProps, nextState) {
    const { seedPhrase } = this.props
    const {
      selectedSeedIndices,
      shuffledSeedWords,
      pendingSeedIndices,
      draggingSeedIndex,
      hoveringIndex,
      isDragging,
    } = this.state

    return seedPhrase !== nextProps.seedPhrase ||
      draggingSeedIndex !== nextState.draggingSeedIndex ||
      isDragging !== nextState.isDragging ||
      hoveringIndex !== nextState.hoveringIndex ||
      selectedSeedIndices.join(' ') !== nextState.selectedSeedIndices.join(' ') ||
      shuffledSeedWords.join(' ') !== nextState.shuffledSeedWords.join(' ') ||
      pendingSeedIndices.join(' ') !== nextState.pendingSeedIndices.join(' ')
  }

  componentDidMount () {
    const { seedPhrase = '' } = this.props
    const shuffledSeedWords = shuffle(seedPhrase.split(' ')) || []
    this.setState({ shuffledSeedWords })
  }

  setDraggingSeedIndex = draggingSeedIndex => this.setState({ draggingSeedIndex })

  setHoveringIndex = hoveringIndex => this.setState({ hoveringIndex })

  onDrop = targetIndex => {
    const {
      selectedSeedIndices,
      draggingSeedIndex,
    } = this.state

    const indices = insert(selectedSeedIndices, draggingSeedIndex, targetIndex, true)

    this.setState({
      selectedSeedIndices: indices,
      pendingSeedIndices: indices,
      draggingSeedIndex: -1,
      hoveringIndex: -1,
    })
  }

  handleExport = () => {
    exportAsFile('MetaMask Secret Backup Phrase', this.props.seedPhrase, 'text/plain')
  }

  handleSubmit = async () => {
    const {
      history,
      setSeedPhraseBackedUp,
      showingSeedPhraseBackupAfterOnboarding,
      hideSeedPhraseBackupAfterOnboarding,
      initializeThreeBox,
    } = this.props

    if (!this.isValid()) {
      return
    }

    try {
      this.context.metricsEvent({
        eventOpts: {
          category: 'Onboarding',
          action: 'Seed Phrase Setup',
          name: 'Verify Complete',
        },
      })

      setSeedPhraseBackedUp(true).then(() => {
        if (showingSeedPhraseBackupAfterOnboarding) {
          hideSeedPhraseBackupAfterOnboarding()
          history.push(DEFAULT_ROUTE)
        } else {
          initializeThreeBox()
          history.push(INITIALIZE_END_OF_FLOW_ROUTE)
        }
      })
    } catch (error) {
      console.error(error.message)
    }
  }

  handleSelectSeedWord = (shuffledIndex) => {
    this.setState({
      selectedSeedIndices: [...this.state.selectedSeedIndices, shuffledIndex],
      pendingSeedIndices: [...this.state.pendingSeedIndices, shuffledIndex],
    })
  }

  handleDeselectSeedWord = shuffledIndex => {
    this.setState({
      selectedSeedIndices: this.state.selectedSeedIndices.filter(i => shuffledIndex !== i),
      pendingSeedIndices: this.state.pendingSeedIndices.filter(i => shuffledIndex !== i),
    })
  }

  isValid () {
    const { seedPhrase } = this.props
    const { selectedSeedIndices, shuffledSeedWords } = this.state
    const selectedSeedWords = selectedSeedIndices.map(i => shuffledSeedWords[i])
    return seedPhrase === selectedSeedWords.join(' ')
  }

  render () {
    const { t } = this.context
    const { history } = this.props
    const {
      selectedSeedIndices,
      shuffledSeedWords,
      draggingSeedIndex,
    } = this.state

    return (
      <div className="confirm-seed-phrase">
        <div className="confirm-seed-phrase__back-button">
          <a
            onClick={e => {
              e.preventDefault()
              history.push(INITIALIZE_SEED_PHRASE_ROUTE)
            }}
            href="#"
          >
            {`< Back`}
          </a>
        </div>
        <div className="first-time-flow__header">
          { t('confirmSecretBackupPhrase') }
        </div>
        <div className="first-time-flow__text-block">
          { t('selectEachPhrase') }
        </div>
        <div
          className={classnames('confirm-seed-phrase__selected-seed-words', {
            'confirm-seed-phrase__selected-seed-words--dragging': draggingSeedIndex > -1,
          })}
        >
          { this.renderPendingSeeds() }
          { this.renderSelectedSeeds() }
        </div>
        <div className="confirm-seed-phrase__shuffled-seed-words">
          {
            shuffledSeedWords.map((word, index) => {
              const isSelected = selectedSeedIndices.includes(index)

              return (
                <DraggableSeed
                  key={index}
                  seedIndex={index}
                  index={index}
                  setHoveringIndex={this.setHoveringIndex}
                  onDrop={this.onDrop}
                  className="confirm-seed-phrase__seed-word--shuffled"
                  selected={isSelected}
                  onClick={() => {
                    if (!isSelected) {
                      this.handleSelectSeedWord(index)
                    } else {
                      this.handleDeselectSeedWord(index)
                    }
                  }}
                  word={word}
                />
              )
            })
          }
        </div>
        <Button
          type="primary"
          className="first-time-flow__button"
          onClick={this.handleSubmit}
          disabled={!this.isValid()}
        >
          { t('confirm') }
        </Button>
      </div>
    )
  }

  renderSelectedSeeds () {
    const { shuffledSeedWords, selectedSeedIndices, draggingSeedIndex } = this.state
    return EMPTY_SEEDS.map((_, index) => {
      const seedIndex = selectedSeedIndices[index]
      const word = shuffledSeedWords[seedIndex]

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
      )
    })
  }

  renderPendingSeeds () {
    const {
      pendingSeedIndices,
      shuffledSeedWords,
      draggingSeedIndex,
      hoveringIndex,
    } = this.state

    const indices = insert(pendingSeedIndices, draggingSeedIndex, hoveringIndex)

    return EMPTY_SEEDS.map((_, index) => {
      const seedIndex = indices[index]
      const word = shuffledSeedWords[seedIndex]

      return (
        <DraggableSeed
          key={`pending-${seedIndex}-${index}`}
          index={index}
          className={classnames('confirm-seed-phrase__selected-seed-words__pending-seed', {
            'confirm-seed-phrase__seed-word--hidden': draggingSeedIndex === seedIndex && index !== hoveringIndex,
          })}
          seedIndex={seedIndex}
          word={word}
          draggingSeedIndex={draggingSeedIndex}
          setDraggingSeedIndex={this.setDraggingSeedIndex}
          setHoveringIndex={this.setHoveringIndex}
          onDrop={this.onDrop}
          droppable={!!word}
        />
      )
    })
  }
}

function insert (list, value, target, removeOld) {
  let nextList = [...list]

  if (typeof list[target] === 'number') {
    nextList = [...list.slice(0, target), value, ...list.slice(target)]
  }

  if (removeOld) {
    nextList = nextList.filter((seed, i) => {
      return seed !== value || i === target
    })
  }

  if (nextList.length > 12) {
    nextList.pop()
  }

  return nextList
}
