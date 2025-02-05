# Ethereum Faucet with hCaptcha

A simple Ethereum faucet application with hCaptcha verification, built with React and Express.

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- A local Ethereum node running on port 32002
- Ethereum address mapped to `PRIVATE_KEY` is seeded with ETH 
- Git

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/adaki2004/evm_faucet
cd evm-faucet
```

2. Start the development environment:
```bash
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: Port 29000 (internal only)

## Local Development without Docker

If you prefer to run the services directly:

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Configuration

The application uses the following environment variables:

Backend (.env):
```
PORT=29000
RPC_URL=http://localhost:32002
PRIVATE_KEY=your_ethereum_private_key
HCAPTCHA_SECRET_KEY=your_hcaptcha_secret_key
```

Frontend:
- The backend API URL is configured to `http://localhost:29000/api`
- hCaptcha site key is configured in App.tsx

## Usage

1. Ensure your local Ethereum node is running on port 32002

2. Connect your MetaMask wallet to the local network:
   - Network Name: Local Network
   - New RPC URL: http://localhost:32002
   - Chain ID: 0x2710A
   - Currency Symbol: ETH

3. Visit http://localhost:3000 in your browser

4. Click "Connect Wallet" to connect MetaMask

5. Complete the hCaptcha verification

6. Click "Claim 0.1 ETH" to receive test ETH

## Local Network Requirements

The application expects an Ethereum node running locally with the following configuration:
- RPC URL: http://localhost:32002
- Chain ID: 0x2710A (100106 in decimal)
- Must be configured to accept RPC connections
- Must have enough ETH in the faucet account (specified by PRIVATE_KEY)

## Notes

- The faucet sends 0.1 ETH per request
- There's a 24-hour cooldown period between claims for each address
- All transactions are processed through the local Ethereum node
- hCaptcha is used to prevent automated claims

## Troubleshooting

1. "Warning localhost detected":
   - This is a known hCaptcha issue when running locally
   - Add `127.0.0.1 faucet.local` to your hosts file
   - Access the application via http://faucet.local:3000

2. MetaMask network switching fails:
   - Ensure your local Ethereum node is running
   - Verify the RPC URL and Chain ID match your local node
   - Check if MetaMask is unlocked

3. Transaction failures:
   - Verify the faucet account has sufficient ETH
   - Check if the RPC_URL is accessible
   - Ensure PRIVATE_KEY is correctly set

## License

MIT