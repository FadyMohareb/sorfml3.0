import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Loader } from "@googlemaps/js-api-loader";
import { URLS } from '../urls';
import {} from 'google.maps';
import { GoogleMapsAPIKey } from '../google-api-key';

import {
  convertTimeFormat,
  getLocationInfo,
  reverseHistory,
  addPositionNum,
  createPinContent
} from './utils'; // utils.ts contains external functions for Google Map

function animateCircle(line: google.maps.Polyline) {
  let count = 0;

  window.setInterval(() => {
    count = (count + 1) % 200;

    const icons = line.get('icons');

    icons[0].offset = count / 2 + '%';
    line.set('icons', icons);
  }, 20);
}

@Component({
  selector    : 'app-view-tracking-google-map',
  templateUrl : './view-tracking-google-map.component.html',
  styleUrls   : ['./view-tracking-google-map.component.css']
})
export class ViewTrackingGoogleMapComponent implements OnInit {

  currentUserId    = this.auth.getUserDetails()._id;
  httpParams       = new HttpParams();
  productId        : string;
  titleProductName : string;
  txHistory        : any;
  trackingInfo     : any;
  hiddenSpinner    : boolean = true;
  httpOptions;

  constructor(
    private router         : Router,
    private activatedRoute : ActivatedRoute,
    private _http          : HttpClient,
    public  auth           : AuthenticationService,
  ) {
    // 0. Omajinai
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      responseType:'json'
    };
  }

  ngOnInit() {
    // Show loading spinner
    this.hiddenSpinner = false;

    // Get product ID from query parameter
    this.activatedRoute.queryParams.subscribe(params => {
      //console.log('Query parameter:');
      //console.log(params.productid);
      this.productId = params.productid;
    });

    // Get transaction history parameter from URL
    this.httpParams = (this.httpParams).append('productId', this.productId    );
    this.httpParams = (this.httpParams).append('userId',    this.currentUserId);
    //console.log(this.httpParams);

    // Get transaction history as JSON
    this._http.get<any>(URLS.ViewTransactionHistory, {params: (this.httpParams)}).subscribe(async (data) => {
      console.log('[view-tracking-google-map.components.ts/constructor]: Result data:');
      console.log(data);
      this.txHistory = data;

      // Pick up the product name
      this.titleProductName = (data[0]).ProductName;

      // Pick up the location point for Google Map
      this.trackingInfo = getLocationInfo(this.txHistory);
      //console.log(this.trackingInfo);

      // Convert the time format
      this.trackingInfo = convertTimeFormat(this.trackingInfo);
      //console.log(this.trackingInfo);

      // Reverse the objects' order into "past → present"
      this.trackingInfo = reverseHistory(this.trackingInfo);
      //console.log(this.trackingInfo);

      // Add position numbers
      this.trackingInfo = addPositionNum(this.trackingInfo);
      //console.log(this.trackingInfo);

      // Define Google API loader
      const loader = new Loader({
        apiKey    : GoogleMapsAPIKey.Key,
        version   : 'weekly',
        libraries : ['places']
      });

      // Activate Google Maps API
      await loader.load().then( () => {console.log('Google Maps Time!');});

      // Hide loading spinner
      this.hiddenSpinner = true;

      /* THIS IS FOR ADVANCED MARKER IMPLEMENTATION.
       * BUT THEY ARE NOT USED AT THE MOMENT.
      //@ts-ignore
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      */

      // Define Google Map API object
      const googleMap = new google.maps.Map(document.getElementById('google-map'),{ zoom: 10, });

      // Define service for Placeservice
      const service = new google.maps.places.PlacesService(googleMap);

      // Define a function to search coordinates from location name:
      // This should be a Promise function as it should wait until
      // all the proccesses are done
      let getcoordPromise = function getCoordFromLocationName(service: google.maps.places.PlacesService, locationRequest: any) {
        return new Promise((resolve, reject) => {
          service.findPlaceFromQuery(locationRequest, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              /* This code block will be Potentially used very soon !!!
              for (var j = 0; j < results.length; j++) {
                const latValue = results[j].geometry.location.lat();
                const lngValue = results[j].geometry.location.lng();
                const location_coord = {lat : latValue, lng : lngValue};
              }
              */
              const latValue      = results[0].geometry.location.lat();
              const lngValue      = results[0].geometry.location.lng();
              const locationCoord = {lat: latValue, lng: lngValue};
              resolve(locationCoord);
            } else {
              reject('Rejected: Something wrong in google.maps.places.PlacesService.');
            }
          });
        })
      };

      // Get coordinate information
      var locationCoordList = [];
      for (var i = 0; i < (this.trackingInfo).length; i++) {
        const locationRequest = {
          query  : ((this.trackingInfo)[i]).Location,
          fields : ['name', 'geometry'],
        };

        const location = await getcoordPromise(service, locationRequest)
          .then( (result) => {console.log(`The return value is ${result}`); return result})
          .catch((error)  => {console.log(`The return value is ${error}`);  return null  });

        locationCoordList.push(location);
      }
      //console.log(locationCoordList);

      // Set markers
      //const pinGlyph       = '1';
      //const pinGlyphColor  = 'white';
      //const pinBackground  = '#5D12D2';
      //const pinBorderColor = '#392467';

      for (var i = 0; i < (locationCoordList).length; i++) {
        // Define pin appearance
        /*
        const pin = new PinElement({
          glyph       : (i + 1).toString(),
          glyphColor  : pinGlyphColor,
          background  : pinBackground,
          borderColor : pinBorderColor,
        });
        */

        // The position of the first marker will be the center
        if (i === 0) {googleMap.setCenter(locationCoordList[i]);}

        // Define marker info
        const marker = new google.maps.Marker({
          position : locationCoordList[i],
          map      : googleMap,
          //content  : pin.element,
        });

        // Get tracking info
        const contentString = createPinContent(
          (this.trackingInfo[i]).ProductName,
          (this.trackingInfo[i]).ProductID,
          (this.trackingInfo[i]).Owner,
          (this.trackingInfo[i]).EventTimestamp,
          (this.trackingInfo[i]).Weight,
          (this.trackingInfo[i]).Location,
          (this.trackingInfo[i]).Temperature,
          (this.trackingInfo[i]).UseByDate
        );

        // Define new window
        const infoWindow = new google.maps.InfoWindow({
          content : contentString,
        });

        // Set tracking info
        marker.addListener('click', () => {
          infoWindow.close();
          infoWindow.setContent(contentString);
          infoWindow.open(googleMap, marker);
        });
      }

      // Set arrows
      const arrowSymbol = {
        path        : google.maps.SymbolPath.FORWARD_OPEN_ARROW,
        scale       : 3,
        strokeColor : '#525FE1',
      };
      for (var i = 0; i < (locationCoordList).length - 1; i++) {
        const arrow = new google.maps.Polyline({
          path          :[locationCoordList[i], locationCoordList[i + 1]],
          strokeColor   : '#525FE1',
          strokeOpacity : 1.0,
          strokeWeight  : 4,
          icons         : [{icon: arrowSymbol, offset: "100%",}],
          map           : googleMap
        });
        animateCircle(arrow);
      }
    });
  }

  backToTxHistory() {
    // Define viewTransactionHistory URL with query product ID
    const urlWithProductId = 'tracking/viewTransactionHistory' +
    '?productid=' +
    this.productId;
    //console.log(urlWithProductId);

    // Go !!!
    this.router.navigateByUrl(urlWithProductId);
  }

  initMap() {
  }
}
