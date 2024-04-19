export interface ProductTemplate {
  productId: string;
  owner_Org: string;
  //currentOwner: string;
  //currentOwnerName: string;
  transferTo_Org: string;
  productName: string;
  productType: string;
  location: string;
  weight: Number;
  temperature: Number;
  useByDate: Date;
  linkedExperiments: Array<String>;
}

/*
export interface ProductTemplate {
  productId              : string;        // e.g. <randomly gererated sequence>
  productName            : string;        // e.g. cattle, orange, suger, mince-beef, orange-juice etc.
  productType            : string;        // e.g. primary, derived and others
  productIngredientIDs   : Array<String>; // e.g. <array of the ingredients' IDs>
  productIngredientNames : Array<String>; // e.g. [orange, sugar]
  currentOwnerName       : string;        // e.g. Name of farm, factory, producer and retailer etc.
  currentOwnerType       : string;        // e.g. producer, manufacturer, deliverer, retailer and maybe, regulatory department
  followOnOwnerName      : string;        // e.g. Name of farm, factory, producer and retailer etc.
  location               : string;        //
  weight                 : Number;        //
  temperature            : Number;        //
  timeStamp              : Date;          //
  useByDate              : Date;          //
}
*/
