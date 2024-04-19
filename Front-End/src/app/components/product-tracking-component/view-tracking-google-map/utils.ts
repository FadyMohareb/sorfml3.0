// Function to 'purify' the JSON for Google Map:
// It will remove duplication of location info
export function getLocationInfo(txHistory) {
  var trackingInfo     = [txHistory[0]];
  var previousLocation = (txHistory[0]).Location;
  //console.log(previousLocation);

  // If different location pops by: push it into trackingInfo
  for (var elem of txHistory) {
    if (elem.Location !== previousLocation) {
      trackingInfo.push(elem);
      previousLocation = elem.Location;
    }
  }
  //console.log(trackingInfo);

  return trackingInfo;
}

// Function to convert ISO Date String into custom date
export function convertTimeFormat(trackingInfo) {
  const txHistLen = trackingInfo.length;

  for (var i = 0; i < txHistLen; i++){
    // Get 'EventTimestamp' property in each loop
    const dateIso = (trackingInfo[i])['EventTimestamp'];

    // Split ISO Date String into date and time 
    const dateIsoArray = dateIso.split('T', 2);
    const substrDate   = dateIsoArray[0];
    const substrTime   = dateIsoArray[1];
    //console.log(substrDate);
    //console.log(substrTime);

    // Extract date
    const substrDateArray = substrDate.split('-', 3);
    const date  = substrDateArray[2];
    const month = substrDateArray[1];
    const year  = substrDateArray[0];

    // Extract time
    const substrTimeArray = substrTime.split(':', 3);
    const minute = substrTimeArray[1];
    const hour   = substrTimeArray[0];

    // Covert!
    const timeModified = date + '/' + month + '/' + year + ' ' + hour + ':' + minute + ' (GMT)';
    //console.log(timeModified);

    // Assign the converted time String back
    (trackingInfo[i])['EventTimestamp'] = timeModified;
  }

  return trackingInfo;
}

// Function of reversing the order of the history
// so that it is going to be "past → present".
export function reverseHistory(trackingInfo) {
  return trackingInfo.reverse();
}

// Function of adding position number
export function addPositionNum(trackingInfo) {
  for (var i = 0; i < trackingInfo.length; i++) {
    (trackingInfo[i])['Position'] = ( i + 1 ).toString();
  }

  return trackingInfo;
}

export function createPinContent(
  ProductName    : string,
  ProductID      : string,
  Owner          : string,
  EventTimestamp : string,
  Weight         : string,
  Location       : string,
  Temperature    : string,
  UseByDate      : string
  ) {
  const pinContent =
  '<div id=content style="font-weight: bold; text-align: center;">' +
    '<h4>' + ProductName + '</h4>' +
  '</div>' +
  '<div>' +
    '<table>' +
      '<tr>' +
        '<td style="text-align: left; font-weight: bold;">Owner: </td>' +
        '<td>' + Owner + '</td>' +
      '</tr>' +
      '<tr>' +
      '<td style="text-align: left; font-weight: bold;">Timestamp: </td>' +
      '<td>' + EventTimestamp + '</td>' +
      '</tr>' +
      '<tr>' +
        '<td style="text-align: left; font-weight: bold;">Product ID: </td>' +
        '<td>' + ProductID + '</td>' +
      '</tr>' +
      '<tr>' +
          '<td style="text-align: left; font-weight: bold;">Weight: </td>' +
          '<td>' + Weight + ' Kg</td>' +
      '</tr>' +
      '<tr>' +
        '<td style="text-align: left; font-weight: bold;">Location: </td>' +
        '<td>' + Location + '</td>' +
      '</tr>' +
      '<tr>' +
        '<td style="text-align: left; font-weight: bold;">Temperature: </td>' +
        '<td>' + Temperature + ' ℃</td>' +
      '</tr>' +
      '<tr>' +
        '<td style="text-align: left; font-weight: bold;">Use-by date: </td>' +
        '<td>' + UseByDate + '</td>' +
      '</tr>' +
    '</table>' +
  '</div>';

  return pinContent;
}
