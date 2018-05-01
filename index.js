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
  const output = solc.compile(multisigSrc, 1);
  const abi = JSON.parse(output.contracts[':MultiSigWallet'].interface);
  const bytecode = '0x' + output.contracts[':MultiSigWallet'].bytecode;

  const nonce = await web3.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS);
  const deployed = await deployContract({
    nonce, web3, abi, bytecode, args: [[OWNER_1, OWNER_2, OWNER_3], REQUIRED]
  })
  console.log(deployed.options.address)

}
main()
