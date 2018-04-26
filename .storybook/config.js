import { configure } from '@storybook/react'
import '../ui/app/css/index.scss'

const req = require.context('../ui/app/components', true, /\.stories\.js$/)

function loadStories() {
  require('./decorators'),
  req.keys().forEach((filename) => req(filename))
}

configure(loadStories, module)
