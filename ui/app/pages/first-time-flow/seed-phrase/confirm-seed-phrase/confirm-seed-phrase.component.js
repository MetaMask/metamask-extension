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
    isDragging: false,
  }

  beginDrag = () => this.setState({ isDragging: true })

  endDrag = () => this.setState({ isDragging: false })

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
            { this.state.isDragging ? this.renderPendingSeeds() : this.renderSelectedSeeds() }
          </div>
          <div className="confirm-seed-phrase__shuffled-seed-words">
            {
              shuffledSeedWords.map((word, index) => {
                const isSelected = selectedSeedIndices.includes(index)

                return (
                  <DraggableSeed
                    key={index}
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
                    word={word}
                    index={index}
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
          word={word}
          hover={this.hover}
          beginDrag={this.beginDrag}
          endDrag={this.endDrag}
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
          word={word}
          hover={this.hover}
          beginDrag={this.beginDrag}
          endDrag={this.endDrag}
          droppable
        />
      )
    })
  }
}
