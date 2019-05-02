import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import shuffle from 'lodash.shuffle'
import Button from '../../../../components/ui/button'
import {
  INITIALIZE_END_OF_FLOW_ROUTE,
  INITIALIZE_SEED_PHRASE_ROUTE,
} from '../../../../helpers/constants/routes'
import { exportAsFile } from '../../../../helpers/utils/util'
import { DragDropContextProvider } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import DraggableSeed from './draggable-seed.component'

const EMPTY_SEEDS = Array(12).fill(null);

export default class ConfirmSeedPhrase extends PureComponent {
  static contextTypes = {
    metricsEvent: PropTypes.func,
    t: PropTypes.func,
  }

  static defaultProps = {
    seedPhrase: '',
  }

  static propTypes = {
    history: PropTypes.object,
    onSubmit: PropTypes.func,
    seedPhrase: PropTypes.string,
  }

  state = {
    selectedSeedIndices: [],
    shuffledSeedWords: [],
    pendingSeedIndices: [],
    draggingSeedIndex: -1,
    isDragging: false,
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const { seedPhrase } = this.props
    const {
      selectedSeedIndices,
      shuffledSeedWords,
      pendingSeedIndices,
      draggingSeedIndex,
      isDragging,
    } = this.state

    return seedPhrase !== nextProps.seedPhrase ||
      draggingSeedIndex !== nextState.draggingSeedIndex ||
      isDragging !== nextState.isDragging ||
      selectedSeedIndices.join(' ') !== nextState.selectedSeedIndices.join(' ') ||
      shuffledSeedWords.join(' ') !== nextState.shuffledSeedWords.join(' ') ||
      pendingSeedIndices.join(' ') !== nextState.pendingSeedIndices.join(' ')
  }

  beginDrag = draggingSeedIndex => {
    console.log('begin drag on ', draggingSeedIndex);
    this.setState({ draggingSeedIndex })
  }

  endDrag = () => {
    console.log('end drag');
    this.setState({ draggingSeedIndex: -1 })
  }

  insertToPending = (insertIndex) => {
    const { pendingSeedIndices, draggingSeedIndex: seedIndex } = this.state

    if (pendingSeedIndices[insertIndex] === seedIndex) {
      return
    }

    const newPendingSeedIndices = EMPTY_SEEDS
      .reduce((acc, _, i) => {
        const pendingSeedIndex = pendingSeedIndices[i]

        if (insertIndex === i) {
          acc.push(seedIndex)
        }

        if (pendingSeedIndex === seedIndex) {
          return acc
        }

        if (typeof pendingSeedIndex !== 'number' && insertIndex === i) {
          return acc
        }

        acc.push(pendingSeedIndex)

        return acc
      }, [])

    if (newPendingSeedIndices.length > 12) {
      newPendingSeedIndices.length = 12
    }

    if (newPendingSeedIndices.join(' ') === pendingSeedIndices.join(' ')) {
      return
    }

    this.setState({
      pendingSeedIndices: newPendingSeedIndices,
    })
  }

  removeFromPending = (seedIndex) => {
    this.setState({
      pendingSeedIndices: this.state.pendingSeedIndices.filter(s => s !== seedIndex),
    })
  }

  resetPending = () => this.setState({ pendingSeedIndices: [...this.state.selectedSeedIndices]})

  onDrop = (targetIndex) => {
    const { selectedSeedIndices, draggingSeedIndex: seedIndex } = this.state

    const newSelectedSeedIndices = EMPTY_SEEDS.reduce((acc, _, i) => {
      const selectedSeedIndex = selectedSeedIndices[i]

      if (targetIndex === i) {
        acc.push(seedIndex)
      }

      if (selectedSeedIndex === seedIndex) {
        return acc
      }

      if (typeof selectedSeedIndex !== 'number' && targetIndex === i) {
        return acc
      }

      acc.push(selectedSeedIndex)

      return acc
    }, [])

    if (newSelectedSeedIndices.length > 12) {
      newSelectedSeedIndices.length = 12
    }

    this.setState({
      selectedSeedIndices: newSelectedSeedIndices,
      pendingSeedIndices: [...newSelectedSeedIndices],
    })
  }

  componentDidMount () {
    const { seedPhrase = '' } = this.props
    const shuffledSeedWords = shuffle(seedPhrase.split(' ')) || []
    this.setState({ shuffledSeedWords })
  }

  handleExport = () => {
    exportAsFile('MetaMask Secret Backup Phrase', this.props.seedPhrase, 'text/plain')
  }

  handleSubmit = async () => {
    const { history } = this.props

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
      history.push(INITIALIZE_END_OF_FLOW_ROUTE)
    } catch (error) {
      console.error(error.message)
    }
  }

  handleSelectSeedWord = (word, shuffledIndex) => {
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
    const { selectedSeedIndices, shuffledSeedWords } = this.state

    return (
      <DragDropContextProvider backend={HTML5Backend}>
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
          <div className="confirm-seed-phrase__selected-seed-words">
            { this.state.draggingSeedIndex > -1 ? this.renderPendingSeeds() : this.renderSelectedSeeds() }
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
                    className={classnames(
                      'confirm-seed-phrase__seed-word--shuffled',
                    )}
                    selected={isSelected}
                    onClick={() => {
                      if (!isSelected) {
                        this.handleSelectSeedWord(word, index)
                      } else {
                        this.handleDeselectSeedWord(index)
                      }
                    }}
                    beginDrag={this.beginDrag}
                    endDrag={this.endDrag}
                    resetPending={this.resetPending}
                    onDrop={this.onDrop}
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
      </DragDropContextProvider>
    )
  }

  renderSelectedSeeds () {
    const { shuffledSeedWords, selectedSeedIndices } = this.state
    return EMPTY_SEEDS.map((_, index) => {
      const seedIndex = selectedSeedIndices[index]
      const word = shuffledSeedWords[seedIndex]

      return (
        <DraggableSeed
          key={index}
          index={index}
          seedIndex={seedIndex}
          word={word}
          hover={this.hover}
          beginDrag={this.beginDrag}
          endDrag={this.endDrag}
          removePending={this.removeFromPending}
          resetPending={this.resetPending}
          onDrop={this.onDrop}
          draggingSeedIndex={this.state.draggingSeedIndex}
          droppable
        />
      )
    })
  }

  renderPendingSeeds () {
    const { pendingSeedIndices, shuffledSeedWords } = this.state

    return EMPTY_SEEDS.map((_, index) => {
      const seedIndex = pendingSeedIndices[index]
      const word = shuffledSeedWords[seedIndex]

      return (
        <DraggableSeed
          key={index}
          index={index}
          seedIndex={seedIndex}
          word={word}
          hover={this.hover}
          beginDrag={this.beginDrag}
          endDrag={this.endDrag}
          insertPending={this.insertToPending}
          removePending={this.removeFromPending}
          resetPending={this.resetPending}
          onDrop={this.onDrop}
          draggingSeedIndex={this.state.draggingSeedIndex}
          droppable
        />
      )
    })
  }
}
