import React, { useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { ethers } from 'ethers';

function App() {
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2710A' }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x2710A',
                chainName: 'Local Network',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['http://127.0.0.1:32002'],
              }],
            });
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
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:29000/api/claim', {
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

      setSuccess(`Successfully sent ETH! TX Hash: ${data.txHash}`);
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
                <h1 className="text-2xl font-bold mb-8 text-center">ETH Faucet</h1>
                
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
                      {loading ? 'Claiming...' : 'Claim 0.1 ETH'}
                    </button>
                  </div>
                )}
                
                {error && (
                  <div className="text-red-500 text-sm mt-4">{error}</div>
                )}
                
                {success && (
                  <div className="text-green-500 text-sm mt-4">{success}</div>
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