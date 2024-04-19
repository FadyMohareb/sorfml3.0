'use strict';

class Product {
  constructor() {
    this.productName;
    this.productType;
    this.productId;
    this.currentOwnerName;
    this.eventTimestamp;
    this.id;               // Product ID -generated as unique sha-256 hash based on date and time of asset creation. Is the key for blockchain storage
    this.owner_Org;        // Name of organisation that currently owns the asset;
    this.transferTo_Org;   // If the asset is called of a transfer, the name of the organisation that the asset needs to be transferred to;
    this.type;             // Type of asset; eg. pork,chicken,fish etc.;
    this.location;         // Current location of the asset;
    this.weight;           // Current weight of the asset;
    this.temperature;      // Current temperature of the asset storage conditions;
    this.useByDate;        // Current assigned use-by-date of the asset;
    this.linkedExperiments // Experiment IDs linked to the asset;
  }

  static from(bufferOrJson) {
    if (Buffer.isBuffer(bufferOrJson)) {
      if (!bufferOrJson.length) {
        return;
      }
      bufferOrJson = JSON.parse(bufferOrJson.toString('utf-8'));
    }
    return Object.assign(new Product(),bufferOrJson);
  }

  toJson() {
    return JSON.stringify(this);
  }


  toBuffer() {
    return Buffer.from(this.toJson());
  }
}

module.exports = {Product};
