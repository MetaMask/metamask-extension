const Component = require('react').Component
const createElement  = require('react').createElement
const blockies = require("ethereum-blockies");

class BlockiesIdenticon extends Component {

  constructor(props) {
    super(props);
  }

  getOpts () {
    return {
      seed: this.props.seed,
      color: this.props.color,
      bgcolor: this.props.bgcolor,
      size: this.props.size,
      scale: this.props.scale,
      spotcolor: this.props.spotcolor,
    };
  }

  componentDidMount() {
    this.draw();
  }

  draw() {
    blockies.render(this.getOpts(), this.canvas);
  }

  render() {
    return createElement("canvas", {ref: canvas => this.canvas = canvas});
  }
}

module.exports = BlockiesIdenticon;
