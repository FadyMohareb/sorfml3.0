/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fs = require('fs');
const path = require('path');


// !!! Change This line into your own connection-org1.json file's full-path !!!
const ccp_path_org1 = '/Users/shintarokinoshita/Desktop/SorfML_Git/hyperledger/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json';
// !!! Change This line into your own connection-org2.json file's full-path !!!
const ccp_path_org2 = '/Users/shintarokinoshita/Desktop/SorfML_Git/hyperledger/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/connection-org2.json';

exports.buildCCPOrg1 = () => {
  // load the common connection configuration file
  const ccpPath = ccp_path_org1;
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
    throw new Error(`[AppUtils.js/buildCCPOrg1()]: No such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, 'utf8');

  // build a JSON object from the file contents
  const ccp = JSON.parse(contents);
  console.log('[AppUtils.js/buildCCPOrg1()]: Loaded the network configuration located at:');
  console.log(` => \x1b[32m${ccpPath}\x1b[39m\n`);
  //console.log(ccp);

  return ccp;
};

exports.buildCCPOrg2 = () => {
  // Load the common connection configuration file
  const ccpPath = ccp_path_org2;
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
  throw new Error(`[AppUtils.js/buildCCPOrg2()]: No such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, 'utf8');

  // Build a JSON object from the file contents
  const ccp = JSON.parse(contents);
  console.log('[AppUtils.js/buildCCPOrg2()]: Loaded the network configuration located at:');
  console.log(` => \x1b[32m${ccpPath}\x1b[39m\n`);
  //console.log(ccp);

  return ccp;
};

exports.buildWallet = async (Wallets, walletPath) => {
  // Create a new  wallet : Note that wallet is for managing identities.
  let wallet;
  if (walletPath) {
    wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log('[AppUtils.js/buildWallet()]: Built a file system wallet at :');
    console.log(` => \x1b[32m${walletPath}\x1b[39m`);
  } else {
    wallet = await Wallets.newInMemoryWallet();
    console.log('[AppUtils.js/buildWallet()]: Built an in memory wallet');
  }

  return wallet;
};

exports.prettyJSONString = (inputString) => {
  if (inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
  }
  else {
    return inputString;
  }
};
