
var url_string = window.location.href;
var url = new URL(url_string);
var k = url.searchParams.get("customKey");
var key = (k == null || k === '') ? 'AIzaSyBHtMaeHXRipKOibjU6SjvGA2kkT-EskuQ' : k;
var latitude = url.searchParams.get("initLatitude") !== null ? Number(url.searchParams.get("initLatitude")) : 57.70887;
var longitude = url.searchParams.get("initLongitude") !== null ? Number(url.searchParams.get("initLongitude")) : 11.97456;

var script = document.createElement('script');
script.src = 'https://maps.googleapis.com/maps/api/js?key=' + key + '&callback=initMap&libraries=places&v=weekly';
script.async = true;

window.initMap = function() {
  // JS API is loaded and available
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: latitude, lng: longitude },
    zoom: 11,
  });
  const input = document.getElementById("pac-input");
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo("bounds", map);
  autocomplete.setFields(["place_id", "geometry", "name", "formatted_address"]);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  const infowindow = new google.maps.InfoWindow();
  infowindow.setContent("Your photo was taken here");
  const geocoder = new google.maps.Geocoder();


  autocomplete.addListener("place_changed", () => {
    infowindow.close();
    const place = autocomplete.getPlace();

    if (!place.place_id) {
      return;
    }
    geocoder
      .geocode({ placeId: place.place_id })
      .then(({ results }) => {
        top.window.postMessage({coordinates: {lat: results[0].geometry.location.lat(), lon: results[0].geometry.location.lng()}}, "*");
        map.setZoom(11);
        map.setCenter(results[0].geometry.location);
        infowindow.setPosition(results[0].geometry.location);
        infowindow.open(map);
      })
      .catch((e) => window.alert("Geocoder failed due to: " + e));
  });

  // Set a listener on any map clicks
  map.addListener("click", (mapsMouseEvent) => {
    
    top.window.postMessage({coordinates: {lat: mapsMouseEvent.latLng.lat(), lon: mapsMouseEvent.latLng.lng()}}, "*");
    infowindow.setPosition(mapsMouseEvent.latLng);
    infowindow.open(map);

  });

};

// Append the 'script' element to 'head'
document.head.appendChild(script);

