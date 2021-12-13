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

  useEffect(() => {
    const onLoad = async () => {
      setCardano(window.cardano);
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    if (!wallet) return;

    const int = (value) => Number(value.to_str());

    const showBalance = (string) => {
      const value = wasm.Value.from_bytes(hexToBytes(string))
      const locked = wasm.min_ada_required(value, wasm.BigNum.from_str('1000000'))
  
      const result = int(value.coin()) - int(locked);
  
      setBalance(result / 1_000_000);
    }
  
    const networks = ['testnet', 'mainnet'];

    const showNetwork = (network) => {
      setNetwork(networks[network]);
    }

    const showAddress = (hexAddress) => {
      const addr = wasm.Address.from_bytes(hexToBytes(hexAddress))
      setAddress(addr.to_bech32())
    }
  
    const showWalletData = () => {
      cardano.getBalance().then(showBalance);
      cardano.getNetworkId().then(showNetwork);
      cardano.getUsedAddresses().then(x => showAddress(x[0]));
    }

    cardano.onNetworkChange((n) => { showWalletData() });
    cardano.onAccountChange (() => { showWalletData() });

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
