const Component = require('react').Component
const createElement  = require('react').createElement
const blockies = require("ethereum-blockies");

class BlockiesIdenticon extends Component {
  constructor(props) {
    super(props);
  }
  getOpts () {
    return {
      seed: this.props.seed || "foo",
      color: this.props.color || "#dfe",
      bgcolor: this.props.bgcolor || "#a71",
      size: this.props.size || 15,
      scale: this.props.scale || 3,
      spotcolor: this.props.spotcolor || "#000"
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
