const randomColor = require('randomcolor')
const chalk = require('chalk')

module.exports = { setupTaskDisplay, displayChart }

const SYMBOLS = {
  Empty: '',
  Space: ' ',
  Full: '█',
  SevenEighths: '▉',
  ThreeQuarters: '▊',
  FiveEighths: '▋',
  Half: '▌',
  ThreeEighths: '▍',
  Quarter: '▎',
  Eighth: '▏',
  RightHalf: '▐',
  RightEighth: '▕',
}

function setupTaskDisplay(taskEvents) {
  const taskData = []
  taskEvents.on('start', ([name]) => {
    console.log(`Starting '${name}'...`)
  })
  taskEvents.on('end', ([name, start, end]) => {
    taskData.push([name, start, end])
    console.log(`Finished '${name}'`)
  })
  taskEvents.on('complete', () => {
    displayChart(taskData)
  })
}

function displayChart(data) {
  // sort tasks by start time
  data.sort((a, b) => a[1] - b[1])

  // get bounds
  const first = Math.min(...data.map((entry) => entry[1]))
  const last = Math.max(...data.map((entry) => entry[2]))

  // get colors
  const colors = randomColor({ count: data.length })

  // some heading before the bars
  console.log(`\nbuild completed. task timeline:`)

  // build bars for bounds
  data.forEach((entry, index) => {
    const [label, start, end] = entry
    const [start2, end2] = [start, end].map((value) =>
      adjust(value, first, last, 40),
    )
    const barString = barBuilder(start2, end2)
    const color = colors[index]
    const coloredBarString = colorize(color, barString)
    const duration = ((end - start) / 1e3).toFixed(1)
    console.log(coloredBarString, `${label} ${duration}s`)
  })
}

function colorize(color, string) {
  const colorizer =
    typeof chalk[color] === 'function' ? chalk[color] : chalk.hex(color)
  return colorizer(string)
}

// scale number within bounds
function adjust(value, first, last, size) {
  const length = last - first
  const result = ((value - first) / length) * size
  return result
}

// draw bars
function barBuilder(start, end) {
  const [spaceInt, spaceRest] = splitNumber(start)
  const barBodyLength = end - spaceInt
  let [barInt, barRest] = splitNumber(barBodyLength)
  // We are handling zero value as a special case
  // to print at least something on the screen
  if (barInt === 0 && barRest === 0) {
    barInt = 0
    barRest = 0.001
  }

  const spaceFull = SYMBOLS.Space.repeat(spaceInt)
  const spacePartial = getSymbolNormalRight(spaceRest)
  const barFull = SYMBOLS.Full.repeat(barInt)
  const barPartial = getSymbolNormal(barRest)

  return `${spaceFull}${spacePartial}${barFull}${barPartial}`
}

// get integer and remainder
function splitNumber(value = 0) {
  const [int, rest = '0'] = value.toString().split('.')
  const int2 = parseInt(int, 10)
  const rest2 = parseInt(rest, 10) / Math.pow(10, rest.length)
  return [int2, rest2]
}

// get partial block char for value (left-adjusted)
function getSymbolNormal(value) {
  // round to closest supported value
  const possibleValues = [0, 1 / 8, 1 / 4, 3 / 8, 1 / 2, 5 / 8, 3 / 4, 7 / 8, 1]
  const rounded = possibleValues.reduce((prev, curr) => {
    return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  })

  if (rounded === 0) {
    return SYMBOLS.Empty
  } else if (rounded === 1 / 8) {
    return SYMBOLS.Eighth
  } else if (rounded === 1 / 4) {
    return SYMBOLS.Quarter
  } else if (rounded === 3 / 8) {
    return SYMBOLS.ThreeEighths
  } else if (rounded === 1 / 2) {
    return SYMBOLS.Half
  } else if (rounded === 5 / 8) {
    return SYMBOLS.FiveEighths
  } else if (rounded === 3 / 4) {
    return SYMBOLS.ThreeQuarters
  } else if (rounded === 7 / 8) {
    return SYMBOLS.SevenEighths
  }
  return SYMBOLS.Full
}

// get partial block char for value (right-adjusted)
function getSymbolNormalRight(value) {
  // round to closest supported value (not much :/)
  const possibleValues = [0, 1 / 2, 7 / 8, 1]
  const rounded = possibleValues.reduce((prev, curr) => {
    return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  })

  if (rounded === 0) {
    return SYMBOLS.Full
  } else if (rounded === 1 / 2) {
    return SYMBOLS.RightHalf
  } else if (rounded === 7 / 8) {
    return SYMBOLS.RightEighth
  } else if (rounded === 1) {
    return SYMBOLS.Space
  }
  throw new Error('getSymbolNormalRight got unexpected result')
}
