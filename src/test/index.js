import TronWeb from 'tronweb';

// Function to generate a TRON private key
function generateTronPrivateKey() {
    // Create an instance of TronWeb
    const tronWeb = new TronWeb({
        fullHost: 'https://api.trongrid.io'
    });

    // Generate a random private key
    const privateKey = tronWeb.utils.accounts.generateAccount().privateKey;

    return privateKey;
}

// Generate and log the private key
const tronPrivateKey = generateTronPrivateKey();
console.log('TRON Private Key:', tronPrivateKey);