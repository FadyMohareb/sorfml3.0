export class URLS {

  private static IP = "http://localhost:3000/sorfml2_api/api/";

  public static LIST                   = URLS.IP + "tracking/list_assets";
  public static CREATE                 = URLS.IP + "tracking/createproduct";
  public static UpdateAsset            = URLS.IP + "tracking/updateasset";
  public static UpdateTemperature      = URLS.IP + "tracking/updatetemperature";
  public static UpdateLocation         = URLS.IP + "tracking/updateloc";
  public static UpdateWeight           = URLS.IP + "tracking/updateWeight";
  public static LinkExperiment         = URLS.IP + "tracking/LE";
  public static TransferProduct        = URLS.IP + "tracking/transfer";
  public static CompleteTransfer       = URLS.IP + "tracking/completetransfer";
  public static UPDATE                 = URLS.IP + "update";
  public static OrgTransactionHistory  = URLS.IP + "tracking/orgtransactionhistory";
  public static CheckRd                = URLS.IP + "tracking/checkrd";
  public static GetOrganisationNames   = URLS.IP + "tracking/getorganisationnames";
  public static ViewTransactionHistory = URLS.IP + "tracking/viewtransactionhistory";
  public static CreateQrCode           = URLS.IP + "tracking/createqrcode";
  public static DeleteAsset            = URLS.IP + "tracking/deleteasset";
  public static GetAllBranches         = URLS.IP + "tracking/getallbranches";
}
