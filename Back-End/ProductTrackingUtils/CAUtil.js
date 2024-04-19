/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const adminUserId = 'admin';
const adminUserPasswd = 'adminpw';

/**
 *
 * @param {*} FabricCAServices
 * @param {*} ccp
 */
exports.buildCAClient = (FabricCAServices, ccp, caHostName) => {
  // Create a new CA client for interacting with the CA.
  const caInfo       = ccp.certificateAuthorities[caHostName]; //lookup CA details from config
  const caTLSCACerts = caInfo.tlsCACerts.pem;
  const caClient     = new FabricCAServices(caInfo.url, {trustedRoots: caTLSCACerts, verify: false}, caInfo.caName);

  console.log(`[CAUtill.js/buildCAClient()] Built a CA Client named: \x1b[32m${caInfo.caName}\x1b[39m`);

  return caClient;
};

exports.enrollAdmin = async (caClient, wallet, orgMspId) => {
  try {
    // Check to see if we've already enrolled the admin user.
    const identity = await wallet.get(adminUserId);
    if (identity) {
      console.log('\n[CAUtill.js/enrollAdmin()]: An identity for the admin user already exists in the wallet');
      return;
    }

    // Enroll the admin user, and import the new identity into the wallet.
    const enrollment = await caClient.enroll({ enrollmentID: adminUserId, enrollmentSecret: adminUserPasswd });
    const x509Identity = {
      credentials: {
        certificate : enrollment.certificate,
        privateKey  : enrollment.key.toBytes(),
      },
      mspId : orgMspId,
      type  : 'X.509',
    };
    await wallet.put(adminUserId, x509Identity);
    console.log('[CAUtill.js/enrollAdmin()]: \x1b[32mSuccessfully\x1b[39m enrolled admin user and imported it into the wallet');
  } catch (error) {
    console.error(`[CAUtill.js/enrollAdmin()]: Failed to enroll admin user : ${error}`);
  }
};

exports.registerAndEnrollUser = async (
  caClient,
  wallet,
  orgMspId,
  userId,
  affiliation,
  publicNameOrg,
  username) => {
  try {
    // Check to see if we've already enrolled the user
    const userIdentity = await wallet.get(userId);
    if (userIdentity) {
      console.log(`[CAUtill.js/registerAndEnrollUser()]: An identity for the user\x1b[32m ${userId} \x1b[39malready exists in the wallet`);
      return;
    }

    // Must use an admin to register a new user
    const adminIdentity = await wallet.get(adminUserId);
    if (!adminIdentity) {
      console.log('[CAUtill.js/registerAndEnrollUser()]: An identity for the admin user does not exist in the wallet');
      console.log('[CAUtill.js/registerAndEnrollUser()]: Enroll the admin user before retrying');
      return;
    }

    // build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

    // Register the user, enroll the user, and import the new identity into the wallet.
    // If affiliation is specified by client, the affiliation value must be configured in CA
    const secret = await caClient.register({
      affiliation  : affiliation,
      enrollmentID : userId,
      role         : 'client',
      attrs : [
        {
          'name'  : 'Organisation',
          'value' : publicNameOrg
        }, {
          'name'  : 'Username',
          'value' : username
        }
      ]
    },adminUser);
    const enrollment = await caClient.enroll({
      enrollmentID     : userId,
      enrollmentSecret : secret,
      attr_reqs : [
        {
          name     : 'Organisation',
          optional : false
        }, {
          name     : 'Username',
          optional : false
        }
      ]
    });

    const x509Identity = {
      credentials: {
        certificate : enrollment.certificate,
        privateKey  : enrollment.key.toBytes(),
      },
      mspId : orgMspId,
      type  : 'X.509',
    };
    await wallet.put(userId, x509Identity);
    console.log(`\n[CAUtill.js/registerAndEnrollUser()]: \x1b[32mSuccessfully\x1b[39m registered and enrolled user\x1b[32m ${userId} \x1b[39mand imported it into the wallet`);

    // Get the registered client info
    //const showCaInfo = await caClient.getCaInfo(); // THIS EXTENSION DOES NOT WORK !!!
    //console.log('[CAUtill.js/registerAndEnrollUser()]: The registered client information:');
    //console.log(showCaInfo);

    return({message:'Registration of new user successful',status:200})
  } catch (error) {
    console.log(`\n[CAUtill.js/registerAndEnrollUser()]: Failed to register user : ${error}`);
    return ({message:'Registration of new user failed',status:501});
  }
};
