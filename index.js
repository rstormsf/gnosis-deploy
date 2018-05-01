require('dotenv').config();
const solc = require('solc');
const fs = require('fs');
const web3 = require('./web3');
const deployContract = require('./deploymentUtils');

const multisigSrc = fs.readFileSync("MultiSigGnosis.sol", "utf8");


const {
  OWNER_1,
  OWNER_2, 
  OWNER_3, 
  REQUIRED,
  DEPLOYMENT_ACCOUNT_ADDRESS
} = process.env;


async function main(){
  console.log('compling ./MultiSigGnosis.sol ...');
  const output = solc.compile(multisigSrc, 1);
  console.log('compiled successfully ./MultiSigGnosis.sol');
  const abi = JSON.parse(output.contracts[':MultiSigWallet'].interface);
  const bytecode = '0x' + output.contracts[':MultiSigWallet'].bytecode;

  const nonce = await web3.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS);
  const owners = [OWNER_1, OWNER_2, OWNER_3]
  const deployed = await deployContract({
    nonce, web3, abi, bytecode, args: 
    [owners, REQUIRED]
  })
  console.log(`Deployed Multisig: ${deployed.options.address}
   
   Owners: ${owners}
   Required Signatures: ${REQUIRED}
   `)

}
main()
