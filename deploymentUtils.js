const Web3Utils = require('web3-utils')
const Tx = require('ethereumjs-tx')
const fetch = require('node-fetch');

let {
  DEPLOYMENT_ACCOUNT_ADDRESS,
  DEPLOYMENT_ACCOUNT_PRIVATE_KEY,
  RPC_URL, 
  GET_RECEIPT_INTERVAL_IN_MILLISECONDS, 
  GAS_PRICE
} = process.env;

GAS_PRICE = Web3Utils.toWei(GAS_PRICE, 'gwei')
const deploymentPrivateKey = Buffer.from(DEPLOYMENT_ACCOUNT_PRIVATE_KEY, 'hex')

async function deployContract({
  from, nonce, web3, url, gasPrice, gasLimit, abi, bytecode, args, privateKey
}) {
  let options = {
    from: from || DEPLOYMENT_ACCOUNT_ADDRESS,
    gasPrice: gasPrice || GAS_PRICE,
  };

  let instance = new web3.eth.Contract(abi, options);
  
  const rawBytecode = await instance.deploy({
    data: bytecode,
    arguments: args
  }).encodeABI()
  console.log('estimating gas...')
  const gas = await instance.deploy({
    data: bytecode,
    arguments: args
  }).estimateGas()
  console.log('gasLimit = ', gas)
  
  console.log('sending tx...')
  const tx = await sendRawTx({
    data: rawBytecode,
    nonce: Web3Utils.toHex(nonce),
    to: null,
    privateKey: privateKey || deploymentPrivateKey,
    url: url || RPC_URL,
    gasPrice: gasPrice || GAS_PRICE
  })
  if(tx.status !== '0x1'){
    throw new Error('Tx failed');
  }
  instance.options.address = tx.contractAddress;
  instance.deployedBlockNumber = tx.blockNumber
  return instance;
}


async function sendRawTx({data, nonce, to, privateKey, url, gasPrice}) {
  var rawTx = {
    nonce,
    gasPrice: Web3Utils.toHex(gasPrice),
    gasLimit:  Web3Utils.toHex('6700000'),
    to,
    data
  }
  var tx = new Tx(rawTx);
  tx.sign(privateKey);
  var serializedTx = tx.serialize();
  const txHash = await sendNodeRequest(url, "eth_sendRawTransaction", '0x' + serializedTx.toString('hex'));
  console.log('txHash', txHash)
  const receipt = await getReceipt(txHash, url);
  return receipt
}

async function sendNodeRequest(url, method, signedData){
  const request = await fetch(url, {
    headers: {
      'Content-type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params: [signedData],
      id: 1
    })
  });
  const json = await request.json()
  return json.result;
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let count = 0;
async function getReceipt(txHash, url) {
  count += Number(GET_RECEIPT_INTERVAL_IN_MILLISECONDS)/1000
  console.log(count);
  await timeout(GET_RECEIPT_INTERVAL_IN_MILLISECONDS);
  let receipt = await sendNodeRequest(url, "eth_getTransactionReceipt", txHash);
  if(receipt === null) {
    receipt = await getReceipt(txHash, url);
  }
  return receipt;
}

module.exports = deployContract