// Get requirements 
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const { buildCCPOrg1, buildCCPOrg2, buildWallet } = require('./AppUtil');
const FabricCAServices = require('fabric-ca-client');
const {buildCAClient, registerAndEnrollUser, enrollAdmin} = require('./CAUtil');

const channelName   = process.env.CHANNEL_NAME   || 'mychannel';
const chaincodeName = process.env.CHAINCODE_NAME || 'basic';
const walletPath    = path.join(__dirname, 'Wallet');

async function connectNetworkOrg1(userId) {
  // Build connection profile for connecting to target peer
  const connectionProfile = buildCCPOrg1();
  console.log('\n[fabricNetwork.js/connectNetworkOrg1()]: Defined connectionProfile.');
  //console.log(connectionProfile);

  // Build an instance of the fabric ca services client based on
  // The information in the network configuration
  const caOrgClient = buildCAClient(FabricCAServices, connectionProfile, 'ca.org1.example.com');
  console.log('[fabricNetwork.js/connectNetworkOrg1()]: Defined caOrgClient.');
  //console.log(caOrgClient);

  // Build wallet instance at specfied path
  const wallet = await buildWallet(Wallets, walletPath);
  console.log('[fabricNetwork.js/connectNetworkOrg1()]: Defined wallet.');
  //console.log(wallet);

  // stores admin identity in local wallet, if needed
  //await enrollAdmin(caOrgClient, walletOrg1, org1);
  //console.log('[fabricNetwork.js/connectNetworkOrg1]: Enrolled admin.');

  // Create a new gateway for connecting to our target node.
  const gateway = new Gateway();
  console.log('[fabricNetwork.js/connectNetworkOrg1()]: Defined gateway.');

  // Create options for connection
  const connectionOptions = {
    identity  : userId,
    wallet    : wallet,
    discovery : {
      enabled     : true,
      asLocalhost : true // using asLocalhost as this gateway is using a fabric network deployed locally
    }
  };
  console.log('[fabricNetwork.js/connectNetworkOrg1()]: Defined connectionOptions.');
  //console.log(connectionOptions);

  //console.log('\n');

  // Connecting time!
  await gateway.connect(connectionProfile, connectionOptions);
  console.log('[fabricNetwork.js/connectNetworkOrg1()]: The gateway connection is done.');

  // Get the network (channel) our contract is deployed to.
  const network = await gateway.getNetwork(channelName);
  console.log('[fabricNetwork.js/connectNetworkOrg1()]: Getting network is done.');

  // Get the contract from the network.
  const contract = network.getContract(chaincodeName);
  console.log('[fabricNetwork.js/connectNetworkOrg1()]: Getting contract is done.\n');

  //return contract instance for server-level interaction
  return contract;
}

async function connectNetworkOrg2(userId) {
  // Build connection profile for connecting to target peer
  const connectionProfile = buildCCPOrg2();

  // Build an instance of the fabric ca services client based on
  // the information in the network configuration
  const caOrgClient = buildCAClient(FabricCAServices, connectionProfile, 'ca.org2.example.com');

  // Build wallet instance at specfied path
  const wallet = await buildWallet(Wallets, walletPath);

  // Stores admin identity in local wallet, if needed
  await enrollAdmin(caOrgClient, wallet, 'Org2MSP');

  // Register & enroll application user with CA, which is used as client identify to make chaincode calls
  // and stores app user identity in local wallet
  //await registerAndEnrollUser(caOrgClient, wallet, 'Org2MSP', userId, 'org2.department2');

  // Create a new gateway for connecting to our target node.
  const gateway = new Gateway();

  // Create options for connection
  const connectionOptions = {
    identity  : userId,
    wallet    : wallet,
    discovery : {
      enabled     : true,
      asLocalhost : true // Using asLocalhost as this gateway is using a fabric network deployed locally
    }
  };

  // Connecting time!
  await gateway.connect(connectionProfile, connectionOptions);
  console.log('\n[fabricNetwork.js/connectNetworkOrg2()]: The gateway connection is done.');

  // Get the network (channel) our contract is deployed to.
  const network = await gateway.getNetwork(channelName);
  console.log('[fabricNetwork.js/connectNetworkOrg2()]: Getting network is done.');

  // Get the contract from the network.
  const contract = network.getContract(chaincodeName);
  console.log('[fabricNetwork.js/connectNetworkOrg2()]: Getting contract is done.\n');

  //return contract instance for server-level interaction
  return contract;
}

module.exports = {connectNetworkOrg1, connectNetworkOrg2}
