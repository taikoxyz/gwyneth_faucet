import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Chain configurations
const chains = [
  { rpcUrl: process.env.RPC_URL || 'http://host.docker.internal:32002', name: 'Gwnyeth-L1' },
  { rpcUrl: 'http://host.docker.internal:32005', name: 'Gwnyeth-L2A' },
  { rpcUrl: 'http://host.docker.internal:32006', name: 'Gwnyeth-L2B' }
];

// Initialize providers and wallets for all chains
const chainWallets = chains.map(chain => {
  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  return {
    wallet: new ethers.Wallet(process.env.PRIVATE_KEY!, provider),
    name: chain.name,
    rpcUrl: chain.rpcUrl
  };
});

// Store recent claims to prevent abuse (per chain)
const recentClaims = new Map<string, Map<string, number>>();
const CLAIM_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

async function verifyCaptcha(token: string): Promise<boolean> {
  try {
    const response = await axios.post(
      'https://hcaptcha.com/siteverify',
      new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY || '0x0000000000000000000000000000000000000000',
        response: token
      })
    );
    return response.data.success;
  } catch (error) {
    console.error('Captcha verification failed:', error);
    return false;
  }
}

async function sendEthOnChain(chainWallet: typeof chainWallets[0], address: string) {
  try {
    const tx = await chainWallet.wallet.sendTransaction({
      to: address,
      value: ethers.parseEther('0.1')
    });
    return { success: true, txHash: tx.hash, chain: chainWallet.name };
  } catch (error: any) {
    console.error(`Failed to send ETH on ${chainWallet.name}:`, error);
    return { success: false, error: error.message, chain: chainWallet.name };
  }
}

app.post('/api/claim', async (req, res) => {
  try {
    const { address, captchaToken } = req.body;

    // Validate input
    if (!address || !captchaToken) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify captcha
    const isValidCaptcha = await verifyCaptcha(captchaToken);
    if (!isValidCaptcha) {
      return res.status(400).json({ message: 'Invalid captcha' });
    }

    // Check for recent claims on any chain
    const now = Date.now();
    for (const chainWallet of chainWallets) {
      const chainClaims = recentClaims.get(chainWallet.name) || new Map<string, number>();
      const lastClaim = chainClaims.get(address);
      if (lastClaim && now - lastClaim < CLAIM_TIMEOUT) {
        return res.status(400).json({
          message: `Please wait 24 hours between claims on ${chainWallet.name}`
        });
      }
    }

    // Send ETH on all chains
    const results = await Promise.all(
      chainWallets.map(chainWallet => sendEthOnChain(chainWallet, address))
    );

    // Update recent claims for successful transactions
    results.forEach((result, index) => {
      if (result.success) {
        const chainName = chainWallets[index].name;
        const chainClaims = recentClaims.get(chainName) || new Map<string, number>();
        chainClaims.set(address, now);
        recentClaims.set(chainName, chainClaims);
      }
    });

    // Prepare response
    const successfulTxs = results.filter(r => r.success);
    const failedTxs = results.filter(r => !r.success);

    if (successfulTxs.length === 0) {
      return res.status(500).json({
        message: 'Failed to send ETH on all chains',
        details: failedTxs
      });
    }

    res.json({
      message: 'Successfully sent ETH',
      successful: successfulTxs,
      failed: failedTxs
    });

  } catch (error: any) {
    console.error('Claim failed:', error);
    res.status(500).json({
      message: error.message || 'Failed to process claim'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Connected to chains:', chains.map(c => c.name).join(', '));
});