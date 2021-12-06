import './App.css';
import { useEffect, useState } from 'react';
import cbor from 'cbor';
import * as wasm from '@emurgo/cardano-serialization-lib-asmjs';

function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

function App() {

  const [wallet, setWallet] = useState(false);
  const [balance, setBalance] = useState(0);
  const [network, setNetwork] = useState(null);
  const [address, setAddress] = useState("");
  const [cardano, setCardano] = useState(window.cardano);

  // hack when cardano extension take some time to load
  setTimeout(() => {
    setCardano(window.cardano);
  }, 100)

  useEffect(() => {
    if (!wallet) return;
    const networks = ['testnet', 'mainnet'];

    const showNetwork = (network) => {
      setNetwork(networks[network]);
    }
        
    const showWalletData = () => {
      cardano.getBalance().then(showBalance);
      cardano.getNetworkId().then(showNetwork);
      cardano.getUsedAddresses().then(x => showAddress(x[0]));
    }

    cardano.onNetworkChange((n) => { showWalletData() });

    showWalletData();
    
    window.cbor = cbor;
    window.wasm = wasm;
  }, [wallet, cardano]);

  useEffect(() => {
    if (cardano) {
      cardano.isEnabled().then( (enabled) => {
        if (enabled) {
          setWallet(true);
        }
      });
    }
  })

  const showBalance = (string) => {
    const decoded = cbor.decode(string)
    if (typeof decoded === 'number') {
      setBalance(decoded / 1_000_000);
    } else {
      setBalance(decoded[0] / 1_000_000)
    }
  }

  const showAddress = (hexAddress) => {
    const addr = wasm.Address.from_bytes(hexToBytes(hexAddress))
    setAddress(addr.to_bech32())
  }

  const connectWallet = () => {
    cardano.enable().then((resp) => {
      setWallet(true);
    }).catch((ex) => {
      alert(ex.info);
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        {! window.cardano && (
          <div>
            Install <a href="https://namiwallet.io/">Nami Wallet Browser Extension</a> to Test this page
          </div>
        )}
        {window.cardano && (
          <div>
            {!(wallet) && (
              <button onClick={connectWallet}>Connect Wallet</button>        
            )}
            {(wallet) && (
              <div>
                <h2>Balance: {balance}</h2>
                <h3>Network: {network}</h3>
                <h5>Address: {address}</h5>
              </div>
            )}
          </div>
        )}

        
      </header>
    </div>
  );
}

export default App;
