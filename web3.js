require('dotenv').config({
  path: __dirname + '.env'
});

const RPC_URL = process.env.RPC_URL;
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider(RPC_URL);
const web3 = new Web3(provider);

module.exports = web3