import React, { useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { ethers } from 'ethers';

// Define types for transaction results
interface SuccessfulTx {
  chain: string;
  txHash: string;
}

interface FailedTx {
  chain: string;
  error: string;
}

function App() {
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successfulTxs, setSuccessfulTxs] = useState<SuccessfulTx[]>([]);

  const chainConfigs = [
    { chainId: '0x2710A', rpcUrl: 'http://localhost:32002' },
    { chainId: '0x28C62', rpcUrl: 'http://localhost:32005' },
    { chainId: '0x28C63', rpcUrl: 'http://localhost:32006' }
  ];

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        // Add all three networks
        for (const config of chainConfigs) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: config.chainId }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: config.chainId,
                  chainName: `Local Network ${config.chainId}`,
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: [config.rpcUrl],
                }],
              });
            }
          }
        }

        setAddress(accounts[0]);
        setIsConnected(true);
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    }
  };

  const handleVerificationSuccess = (token: string) => {
    setCaptchaToken(token);
  };

  const claimEther = async () => {
    if (!address || !captchaToken) return;
    
    setLoading(true);
    setError(null);
    setSuccessfulTxs([]);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          captchaToken,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to claim ETH');
      }

      // Handle successful and failed transactions
      if (data.successful && data.successful.length > 0) {
        setSuccessfulTxs(data.successful);
      }

      if (data.failed && data.failed.length > 0) {
        const failureMessages = data.failed.map((tx: FailedTx) => 
          `${tx.chain}: ${tx.error}`
        );
        setError(`Failed on some chains:\n${failureMessages.join('\n')}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-2xl font-bold mb-8 text-center">Multi-Chain ETH Faucet</h1>
                
                {!isConnected ? (
                  <button
                    onClick={connectWallet}
                    className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm">Connected: {address}</p>
                    
                    <div className="flex justify-center">
                      <HCaptcha
                        sitekey="8a545aba-5e28-4798-bb4c-917a599ce23a"
                        onVerify={handleVerificationSuccess}
                      />
                    </div>
                    
                    <button
                      onClick={claimEther}
                      disabled={!captchaToken || loading}
                      className={`w-full p-3 rounded-lg ${
                        !captchaToken || loading
                          ? 'bg-gray-300'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {loading ? 'Claiming...' : 'Claim 0.1 ETH on All Chains'}
                    </button>
                  </div>
                )}
                
                {error && (
                  <div className="text-red-500 text-sm mt-4 whitespace-pre-line">{error}</div>
                )}
                
                {successfulTxs.length > 0 && (
                  <div className="text-green-500 text-sm mt-4">
                    {successfulTxs.map((tx, index) => (
                      <div key={index} className="mb-2">
                        Successfully sent ETH on {tx.chain}!<br />
                        TX Hash: {tx.txHash}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
