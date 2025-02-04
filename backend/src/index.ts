// src/index.ts
import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize provider and wallet for local network
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:32002');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Store recent claims to prevent abuse
const recentClaims = new Map<string, number>();
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

    // Check for recent claims
    const lastClaim = recentClaims.get(address);
    if (lastClaim && Date.now() - lastClaim < CLAIM_TIMEOUT) {
      return res.status(400).json({ 
        message: 'Please wait 24 hours between claims' 
      });
    }

    // Send ETH
    const tx = await wallet.sendTransaction({
      to: address,
      value: ethers.parseEther('0.1')
    });

    // Update recent claims
    recentClaims.set(address, Date.now());

    res.json({
      message: 'Successfully sent ETH',
      txHash: tx.hash
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
});