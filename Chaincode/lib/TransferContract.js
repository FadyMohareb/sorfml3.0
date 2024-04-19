
'use strict';

const {Contract} = require('fabric-contract-api');
const sha = require('sha256');
const {Product} = require('./product');

class TransferContract extends Contract {
  // Don't need composite keys
  _CreateProductCompositeKey(stub, productId) {
    return stub.createCompositeKey('Product',[`${productId}`]);
  }

  async _GetProduct(stub, productId) {
    const  productBytes = await stub.getState(this._CreateProductCompositeKey(stub, productId));
    return Product.from(productBytes);
  }

  async _CheckOwnership(ctx, productId) {
    const  asset = JSON.parse((await this._GetProduct(ctx.stub, productId)).toJson());
    return asset.Owner == ctx.clientIdentity.getAttributeValue('Organisation');
  }

  async AssetExists(ctx, productId) {
    const  assetJson = await ctx.stub.getState(this._CreateProductCompositeKey(ctx.stub, productId));
    return assetJson && assetJson.length > 0;
  }

  async InitLedger(ctx) {
    const assets = [
      {
        id:"1234",
        owner_Org: 'Example_Butcher',
        transferToOrg:'',
        type: 'Chicken',
        location:'Cranfield_Cold_Storage1',
        weight:0.3,
        temperature:10,
        useByDate:'23/12/23',
        linkedExperiments:[]
      },
      {
        id:"5678",
        owner_Org: 'Example_Butcher',
        transferToOrg:'',
        type: 'Chicken',
        location:'Cranfield_Cold_Storage2',
        weight:0.4,
        temperature:9,
        useByDate:'23/12/23',
        linkedExperiments:[]
      }
    ];

  for (const asset of assets) {
    // example of how to write to world state deterministically
    // use convetion of alphabetic order
    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
    await ctx.stub.putState(this._CreateProductCompositeKey(ctx.stub, asset.id), Product.from(asset).toBuffer());
  }

  return('Ledger Initialised with assets')
  }

  // CreateAsset issues a new asset to the world state with given details
  async CreateAsset(
    ctx,
    productId,   // Product ID, randomly generated (but unique) String
    productName, // Product type (e.g., corn, mince-beef, orange-juice)
    productType, // Product type (e.g., primary, derived or others)
    location,    // Location     (e.g., valencia, london, lutterworth)
    weight,      // Weight / kg
    temperature, // Temperature / ℃
    useByDate,   // Register date
    timeNowStr,  // Time information as 'String'
  ) {
    let asset = {
      ProductID         : productId,
      PreviousProductID : null,
      RootProductID     : productId,
      Owner             : ctx.clientIdentity.getAttributeValue('Organisation'),
      ProductName       : productName,
      ProductType       : productType,
      Location          : location,
      Weight            : weight,
      Temperature       : temperature,
      UseByDate         : useByDate,
      AssetStatus       : 'Created',
      TransferFrom      : null,
      TransferTo        : null,
      TransferWeight    : null,
      EventTimestamp    : timeNowStr,
      EventBy           : ctx.clientIdentity.getAttributeValue('Username'),
      LinkedExperiments : [],
      Hash              : null,
      PreviousHash      : 'GenesisBlock',
    };

    // Check if the product has already exsists:
    // This created product ID should be already confirmed that it does
    // not exist in '_CreatedProductId()'...
    const exists = await this.AssetExists(ctx, productId);
    if (exists) {throw new Error(`The asset ${productId} already exists`);}

    // Set a transaction IDs
    const hash = ctx.stub.getTxID();
    asset.Hash = hash;

    // KABOOOOOOOOOOOOOOEY !!! Register the new asset
    await ctx.stub.putState(this._CreateProductCompositeKey(ctx.stub, productId), Product.from(asset).toBuffer());

    // Create output JSON for MongoDB side
    const outResult = {
      _id                 : asset.ProductID,         // MongoDB data ID (= Product ID)
      product_id          : asset.ProductID,         // Product ID
      previous_product_id : asset.PreviousProductID, // Previous product ID
      root_product_id     : asset.RootProductID,     // Root product ID
      organisation_name   : asset.Owner,             // Owner organisation
      asset_status        : asset.AssetStatus,       // Asset status
    };

    return JSON.stringify(outResult);
  }

  // ReadAsset returns the asset stored in the world state with given ID
  async ReadAsset(ctx, productId) {
    // Comment this code block out to make all the assets public
    //const checkowner = await this._CheckOwnership(ctx, productId);
    //if (!checkowner) { throw new Error('User is not authorised to access this asset');}

    // Get the asset from chaincode state
    const assetJSON = await ctx.stub.getState(this._CreateProductCompositeKey(ctx.stub, productId));
    if (!assetJSON || assetJSON.length === 0) {throw new Error(`The asset ${productId} does not exist`);}

    return assetJSON.toString();
  }

  // RequestTransfer sets ownership transaction request
  // NOTE that the owner is NOT changed in this function yet
  async RequestTransfer(
    ctx,
    currentOwner,   // Current organisation name: is that needy???
    newOwner,       // Requested new organisation name
    transferWeight, // Requested weight of being transferred
    timeNowStr,     // Time information as 'String'
    productId       // Product ID
  ) {
    // Check if the asset ID exsists
    const exists = await this.AssetExists(ctx, productId);
    if (!exists) {throw new Error(`The asset ${productId} does not exist`);}

    // Check if the asset BELONGS to the user
    // It is possble to comment this code block out to make all the asset public
    const checkOwnership = await this._CheckOwnership(ctx, productId);
    if (!checkOwnership) {throw new Error('User is not authorized to access this asset');}

    // Get asset from the query product ID
    const asset = await this._GetProduct(ctx.stub, productId);

    // Check if the asset has already been received a transfer request
    if (asset.AssetStatus === 'Requested') {throw new Error('A transfer has already been requested')}

    // Check if current owner in argument and current owner in Blockchain is same
    if (currentOwner !== asset.Owner) {throw new Error('Name of current owner is not identical')}

    // Update the timestamp
    asset.EventTimestamp = timeNowStr;

    // Update event by user
    asset.EventBy = ctx.clientIdentity.getAttributeValue('Username');

    // Update 'AssetStatus' into 'Requested'
    asset.AssetStatus = 'Requested';

    // Update 'TransferFrom' organisation
    asset.TransferFrom = currentOwner;

    // Update 'TransferTo' organisation
    asset.TransferTo = newOwner;

    // Update 'transferWeight'
    asset.TransferWeight = transferWeight;

    // Update transaction IDs
    asset.PreviousHash = asset.Hash;
    asset.Hash         = ctx.stub.getTxID();

    // KABOOOOOOOOOOOOOOEY !!! Request transaction
    await ctx.stub.putState(this._CreateProductCompositeKey(ctx.stub, productId), asset.toBuffer());

    // JSON data set for MongoDB
    const outResult = {
      _id                 : asset.ProductID,         // MongoDB data ID (= Product ID)
      product_id          : asset.ProductID,         // Product ID
      previous_product_id : asset.PreviousProductID, // Previous product ID
      root_product_id     : asset.RootProductID,     // Root product ID
      organisation_name   : asset.Owner,             // Owner organisation
      asset_status        : asset.AssetStatus,       // Asset status
    };

    return JSON.stringify(outResult);
  }

  // ApproveTransfer approves transaction: this will be activated by
  // a Regulatory Department user
  async ApproveTransfer(
    ctx,
    productId,      // Current product ID (it will be previous ID)
    newProductId,   // New product ID (it will be current product ID)
    transferWeight, // Amount of weight which is being transferred
    timeNowStr      // Time information as 'String'
  ) {
    // Check if the current asset exsists
    const exists = await this.AssetExists(ctx, productId);
    if (!exists) {throw new Error(`The asset ${productId} does not exist`);}

    // Get asset from the query ID
    let asset = await this._GetProduct(ctx.stub, productId);

    // Check if the transfer is requested
    if(asset.AssetStatus !== 'Requested') {throw new Error('Transfer has not been requested')}

    // Check if the new product has already exsists
    const newIdExists = await this.AssetExists(ctx, newProductId);
    if (newIdExists) {throw new Error(`The asset ${newProductId} already exists`);}

    // Update the owner
    asset.Owner = asset.TransferTo;

    // Update the timestamp
    asset.EventTimestamp = timeNowStr;

    // Update event by user
    asset.EventBy = ctx.clientIdentity.getAttributeValue('Username');

    // Update transaction state
    asset.AssetStatus = 'Transferred';

    // Update transferred weight
    asset.Weight = transferWeight;

    // Update product IDs
    asset.PreviousProductID = asset.ProductID;
    asset.ProductID         = newProductId;

    // Update hash
    asset.PreviousHash = asset.Hash;
    asset.Hash         = ctx.stub.getTxID();

    // KABOOOOOOOOOOOOOOEY !!! Register new asset
    await ctx.stub.putState(this._CreateProductCompositeKey(ctx.stub, newProductId), asset.toBuffer());

    // JSON data set for MongoDB
    const outResult = {
      _id                 : asset.ProductID,         // MongoDB data ID (= Product ID)
      product_id          : asset.ProductID,         // Product ID
      previous_product_id : asset.PreviousProductID, // Previous product ID
      root_product_id     : asset.RootProductID,     // Root product ID
      organisation_name   : asset.Owner,             // Owner organisation
      asset_status        : asset.AssetStatus,       // Asset status
    };

    return JSON.stringify(outResult);
  }

  // UpdateAsset returns a JSON data for MongoDB side
  // which contains updated asset info
  async UpdateAsset(
    ctx,
    productId,
    productName,
    temperature,
    weight,
    location,
    useByDate,
    timeNowStr
  ) {
    // Check if the current asset exsists
    const currentIdExists = await this.AssetExists(ctx, productId);
    if (!currentIdExists) {throw new Error(`The asset ${productId} does not exist`);}

    // Get asset from the query ID
    let asset = await this._GetProduct(ctx.stub, productId);

    // Check if asset status is NOT 'Requested', 'Finished' or 'Deleted'
    if      (asset.AssetStatus === 'Requested') {throw new Error('The asset status is Requested');}
    else if (asset.AssetStatus === 'Finished' ) {throw new Error('The asset status is Finished' );}
    else if (asset.AssetStatus === 'Deleted'  ) {throw new Error('The asset status is Deleted'  );}

    // Update new pieces of asset information
    asset.Temperature = temperature;
    asset.Weight      = weight;
    asset.Location    = location;
    asset.UseByDate   = useByDate;

    // If 'ProductName' is updated,
    // change 'ProductType' as well
    if (productName !== asset.ProductName) {
      asset.ProductName = productName;
      asset.ProductType = 'Derived';
    }

    // If the asset has already been transferred:
    // e.g., if 'TransferFrom', 'TransferTo' and 'TransferWeight'
    // are not null - reset them into null
    if (asset.TransferFrom   !== null) {asset.TransferFrom   = null;}
    if (asset.TransferTo     !== null) {asset.TransferTo     = null;}
    if (asset.TransferWeight !== null) {asset.TransferWeight = null;}

    // Update the timestamp
    asset.EventTimestamp = timeNowStr;

    // Update event by user
    asset.EventBy = ctx.clientIdentity.getAttributeValue('Username');

    // Update asset status into 'Edited'
    // If weight is already zero, then 'Finished'
    if (weight === '0') {asset.AssetStatus = 'Finished'; }
    else                {asset.AssetStatus = 'Edited';   }

    // Update hash
    asset.PreviousHash = asset.Hash;
    asset.Hash         = ctx.stub.getTxID();

    // KABOOOOOOOOOOOOOOEY !!!
    await ctx.stub.putState(this._CreateProductCompositeKey(ctx.stub, productId), asset.toBuffer());

    // JSON data set for MongoDB
    const outResult = {
      _id                 : asset.ProductID,         // MongoDB data ID (= Product ID)
      product_id          : asset.ProductID,         // Product ID
      previous_product_id : asset.PreviousProductID, // Previous product ID
      root_product_id     : asset.RootProductID,     // Root product ID
      organisation_name   : asset.Owner,             // Owner organisation
      asset_status        : asset.AssetStatus,       // Asset status
    };

    return JSON.stringify(outResult);
  }

  // UpdateTransferState changes the 'assetStatus' property
  // from 'requested' into 'transferred'.
  async UpdateAssetStatusAndWeight(
    ctx,
    productId,
    balancedWeight,
    timeNowStr
    ) {
    // Check if the current asset exsists
    const exists = await this.AssetExists(ctx, productId);
    if (!exists) {throw new Error(`The asset ${productId} does not exist`);}

    // Get asset from the query ID
    let asset = await this._GetProduct(ctx.stub, productId);

    // Check if the transfer is requested
    if(asset.AssetStatus !== 'Requested') {throw new Error('Transaction has not been requested');}

    // Update the timestamp
    asset.EventTimestamp = timeNowStr;

    // Update event by user
    asset.EventBy = ctx.clientIdentity.getAttributeValue('Username');

    // Update asste state into 'transferred'
    // Check if the balanced weight is zero, set 'Finished'
    if (parseInt(balancedWeight) === 0) {asset.AssetStatus = 'Finished';   }
    else                                {asset.AssetStatus = 'Transferred';}

    // Update weight
    asset.Weight = balancedWeight;

    // Update hash
    asset.PreviousHash = asset.Hash;
    asset.Hash         = ctx.stub.getTxID();

    // KABOOOOOOOOOOOOOOEY !!! Update product
    await ctx.stub.putState(this._CreateProductCompositeKey(ctx.stub, productId), asset.toBuffer());

    // JSON data set for MongoDB
    const outResult = {
      _id                 : asset.ProductID,         // MongoDB data ID (= Product ID)
      product_id          : asset.ProductID,         // Product ID
      previous_product_id : asset.PreviousProductID, // Previous product ID
      root_product_id     : asset.RootProductID,     // Root product ID
      organisation_name   : asset.Owner,             // Owner organisation
      asset_status        : asset.AssetStatus,       // Asset status
    };

    return JSON.stringify(outResult);
  }

  // DeleteAsset deletes an given asset from the world state.
  // However, it does not actually deletes asset: it changes
  // 'AssetStatus' into 'Deleted' and the asset still remains
  // in the Blockchain (No falsification!)
  async DeleteAsset(ctx, productId, timeNowStr) {
    // Check if the asset exists
    const exists = await this.AssetExists(ctx, productId);
    if (!exists) {throw new Error(`The asset ${productId} does not exist`);}

    // Check if the asset belongs to the owner
    const checkOwner = await this._CheckOwnership(ctx, productId);
    if (!checkOwner) {throw new Error('User is not authorized to access this asset');}

    // Get asset from the query ID
    let asset = await this._GetProduct(ctx.stub, productId);

    // Check if 'AssetStatus' is NOT 'Requested' -
    // It will be very messy if the program allows the user
    // to delete pending transferred asset
    if (asset.AssetStatus === 'Requested') {throw new Error('AssetStatus is now Requested, which is NOT allowed to be deleted');}

    // Check if the asset is still not deleted
    if (asset.AssetStatus === 'Deleted') {throw new Error('This asset has already been deleted');}

    // If the asset has already been transferred:
    // e.g., if 'TransferFrom', 'TransferTo' and 'TransferWeight'
    // are not null - reset them into null
    if (asset.TransferFrom   !== null) {asset.TransferFrom   = null;}
    if (asset.TransferTo     !== null) {asset.TransferTo     = null;}
    if (asset.TransferWeight !== null) {asset.TransferWeight = null;}

    // Update AssetStatus into 'Deleted'
    asset.AssetStatus = 'Deleted';

    // Update timestamp
    asset.EventTimestamp = timeNowStr;

    // Update event by user
    asset.EventBy = ctx.clientIdentity.getAttributeValue('Username');

    // Update hash
    asset.PreviousHash = asset.Hash;
    asset.Hash         = ctx.stub.getTxID();

    // KABOOOOOOOOOOOOOOEY !!! Update product
    await ctx.stub.putState(this._CreateProductCompositeKey(ctx.stub, productId), asset.toBuffer());

    // JSON data set for MongoDB
    const outResult = {
      _id                 : asset.ProductID,         // MongoDB data ID (= Product ID)
      product_id          : asset.ProductID,         // Product ID
      previous_product_id : asset.PreviousProductID, // Previous product ID
      root_product_id     : asset.RootProductID,     // Root product ID
      organisation_name   : asset.Owner,             // Owner organisation
      asset_status        : asset.AssetStatus,       // Asset status
    };

    return JSON.stringify(outResult);
  }

  // GetAllAssets returns all assets found in the world state.
  async GetAllAssets(ctx) {
    let ownership_info = ctx.clientIdentity.getAttributeValue('Organisation');
    const allResults = [];
    // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
    const iterator = await ctx.stub.getStateByPartialCompositeKey('Product',[]);
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      if(ownership_info == record.currentOwnerName) {allResults.push(record);}
      result = await iterator.next();
    }

    return JSON.stringify(allResults);
  }

  // GetAssetHistory returns update history of JUST ONE asset
  async GetAssetHistory(ctx, productId) {
    let iterator = await (ctx.stub).getHistoryForKey(this._CreateProductCompositeKey(ctx.stub, productId));
    let result   = [];
    let res      = await iterator.next();
    while (!res.done) {
      if (res.value) {
        console.info(`found state update with value: ${res.value.value.toString('utf8')}`);
        const obj = JSON.parse(res.value.value.toString('utf8'));
        result.push(obj);
      }
      res = await iterator.next();
    }
    await iterator.close();

    return result;
  }

  // GetSubHistory returns one asset transaction history.
  // HOWEVER, it returns part of it based on the given transaction ID:
  // e.g., it returns transaction history between 'txId' and 'end'.
  async GetSubHistory(ctx, productId, hash) {
    // Define empty result object
    let result = [];

    // Get target asset history in JSON format
    const asset = await this.GetAssetHistory(ctx, productId);

    // Fetch part of the history based on 'tx_id'
    var flag = false;
    for (var block of asset) {
      if      (block.Hash === hash) {result.push(block); flag = true;}
      else if (flag === true)       {result.push(block);}
    }

    return result
  }

  // GetTxHistory returns transaction history of an asset
  async GetTxHistory(ctx, productId) {
    // Define a transaction history variable
    let txHistory = [];

    // Get the current owner's asset history at the first place
    let targetAsset = await this.GetAssetHistory(ctx, productId);
    for (var block of targetAsset) {txHistory.push(block);}

    // Let's get previous owner's history!
    while(true) {
      // Define index number of the last block in the asset
      const lastElem = txHistory.length - 1;

      // Define the previous asset ID of the last block in the asset
      const targetAssetId = (txHistory[lastElem]).PreviousProductID;

      // Define the previous hash of the last block in the asset
      const targetHash = (txHistory[lastElem]).PreviousHash;

      // If Previous Hash of the last block is 'GenesisBlock'; break
      if (targetHash === 'GenesisBlock') {
        const owner = (txHistory[lastElem]).Owner;
        console.info(`This owner (${owner}) is on the root of the supply chain!`);
        break;
      } else {
        // Fetch target asset's history between 'targetHash' and 'end'
        targetAsset = await this.GetSubHistory(ctx, targetAssetId, targetHash);

        // Put all the fetched blocks to 'tx_history'
        for (var block of targetAsset) {txHistory.push(block);}
      }
    }

    return txHistory;
  }

}

module.exports = TransferContract;
