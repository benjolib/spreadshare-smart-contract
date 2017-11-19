const Mnemonic = require('bitcore-mnemonic');
// Import the library
const server = require('server');
const { get, post } = server.router;
const { render, json } = server.reply;
// Load ethers
var ethers = require('ethers');
const { Contract, Wallet, providers, utils } = ethers;
// etherConfig
const etherConfig = require(__dirname + '/../config/ether.json');
// load models
var models  = require('../models');
var Promise = require('promise');
// server port
const port = process.env.PORT || 3000;

// gaslimit and Price
const gasLimit = 60000;
const gasPrice = 0xBEBC200; // 1 gwei
const options = { gasLimit, gasPrice };
// constants rinkeby network
const NETWORK = providers.networks.rinkeby;
const CONTRACT_ADDRESS = etherConfig.contractAddress;
const CONTRACT_ABI = require(__dirname + '/../contract/SpreadToken.json');
const PRIVATE_KEY = etherConfig.privateKey;
const API_KEY = etherConfig.apikey;

const wallet = new Wallet(PRIVATE_KEY);
// walletAddress
const walletAddress = wallet.getAddress();
// Connect to INFUA
var infuraProvider = new providers.InfuraProvider(NETWORK, API_KEY);
// Connect to Etherscan
var etherscanProvider = new providers.EtherscanProvider(NETWORK);

// Creating a provider to automatically fallback onto Etherscan
var fallbackProvider = new providers.FallbackProvider([infuraProvider, etherscanProvider]);

// This is equivalent to using the getDefaultProvider
const PROVIDER = providers.getDefaultProvider(NETWORK)


class CustomSigner {

    constructor(wallet) {
        this.wallet = wallet;
        this.provider = PROVIDER;
    }

    getAddress() {
        return Promise.resolve(this.wallet.getAddress());
    }

    sign(transaction) {
        return Promise.resolve(this.wallet.sign(transaction));
    }
}

const provider = PROVIDER;

const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, new CustomSigner(wallet));


const transferToken = get('/transfer/:userId/:amount', async ctx => {

   let amount = ctx.params.amount;

   // retrive address
   let user =  await models.User.findOne({ where: {userId: ctx.params.userId} });

   if(user && amount > 0) {
     // retrive address
    let transferPromise =  await contract.functions.transfer(user.address,ctx.params.amount, options);

    await provider.waitForTransaction(transferPromise);

    const receipt = await provider.getTransactionReceipt(transferPromise);

    return json(receipt);

   } else {
    return json({error: true, message: 'Address not found and amount must be greater than zero'});
   }

})


// createAddress
const createAddress = post('/address', async ctx => {

  // create Mnemonic
  let code = await new Mnemonic(Mnemonic.Words.ENGLISH);
  // generate wallet
  let wallet =  await Wallet.fromMnemonic(code.toString());

  // user object
  let userObject = {
    userId: ctx.data.userId,
    email: ctx.data.email,
    address: wallet.address,
    privateKey: wallet.privateKey,
    defaultGasLimit: wallet.defaultGasLimit,
    mnemonic: wallet.mnemonic
  };

  let user = await models.User.findOrCreate({ where: {userId: userObject.userId,'email': userObject.email}, defaults: userObject });

  try {
   return json(user[0]);
  } catch (e) {
   return json({error: true, message: e.errors[0].message});
  }


});

// getAddress
const getAddress = get('/address/:userId', async ctx => {
  // retrive address
  let user =  await models.User.findOne({ where: {userId: ctx.params.userId} });

  if(user) {
   // retrive current tokens in wallet
   let tokenBalPromise =  await contract.functions.balanceOf(user.address);
   // add actually tokens in wallet
   user.tokens = tokenBalPromise[0].toString(9);
   return json(user);
  } else {
   return json({error: true, message: 'Address not found'});
  }

});


console.log("Current wallet:", walletAddress);

provider.on(walletAddress, blockNumer => console.log("Balance changed in block", blockNumer));


server({ port: port, security: { csrf: false } },createAddress,getAddress,transferToken);
