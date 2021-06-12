import './App.css';
import EthTxParams from './eth-tx-params';
import decodings from './decodings';
import * as Codec from '@truffle/codec';
import React from 'react';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = { template: 0 };
  }

  render() {
    const { template } = this.state;
    const { tx, desc, definitions }= decodings[template];
    const data = deserializeCalldataDecoding(tx);
    console.log('Decoding: %o', data);
 
    return (
      <div className="App">
        <header className="App-header">
          <h1>Tx Param Component</h1>
          <a href="https://github.com/danfinlay/react-eth-tx-params">Fork on GitHub</a>
          <div>
            {
              decodings.map((decoding, i) => {
                return (
                  <button key={i} onClick={() => {
                    console.log('trying to click', i);
                    this.setState({ template: i });
                  }}>{decodings[i].desc}</button>
                )  
              })
            }
          </div>
        </header>

        <main>

          <EthTxParams 
            decoding={data}
            definitions={definitions}
          ></EthTxParams>

        </main>
      </div>
    );
  }
}

export function deserializeCalldataDecoding(decoding) {
  console.log('Deserializing decoding: %o', decoding);
  switch (decoding.kind) {
    case "function": {
      return {
        ...decoding,
        class: Codec.Format.Utils.Serial.deserializeType(decoding.class),
        arguments: decoding.arguments.map(({ name, value }) => ({
          name,
          value: Codec.Format.Utils.Serial.deserializeResult(value)
        }))
      };
    }
    case "constructor": {
      return {
        ...decoding,
        class: Codec.Format.Utils.Serial.deserializeType(decoding.class),
        arguments: decoding.arguments.map(({ name, value }) => ({
          name,
          value: Codec.Format.Utils.Serial.deserializeResult(value)
        }))
      };
    }
    case "message": {
      return {
        ...decoding,
        class: Codec.Format.Utils.Serial.deserializeType(decoding.class)
      };
    }
    case "unknown":
    case "create":
    default:
      return decoding;
  }
}
  
export default App;
