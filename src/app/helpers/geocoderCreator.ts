import Map from 'ol/Map';
import olGeocoder from 'ol-geocoder';
import {
  DataStoreService,
  FIRST_NAME,
  getAddress,
  StoreData,
} from '../../services/data-store.service';
import { UserPositionService } from '../../services/user-position.service';
import { fromLonLat } from 'ol/proj';

export function geocoderCreator(
  map: Map,
  zoomLevelSingleMarker: number,
  dataStoreService: DataStoreService,
  userPositionService: UserPositionService
) {
  const geocoder = new olGeocoder('nominatim', {
    provider: 'photon',
    placeholder: 'Search for ...',
    targetType: 'text-input',
    limit: 1,
    keepOpen: true,
    target: document.body,
    preventDefault: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geocoder.on('addresschosen', (evt: any) => {
    const originalDetails = evt.address.original.details;
    const storeData = dataStoreService.get({
      postcode: originalDetails.postcode,
      housenumber: evt.address.original.details.housenumber,
      city: originalDetails.city,
    });
    console.log('street map found', originalDetails);
    userPositionService.updateUserPosition(
      evt.place.lon,
      evt.place.lat,
      storeData ? storeData[FIRST_NAME] : undefined,
      storeData,
      JSON.stringify(originalDetails)
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geocoder.once('addresschosen', (evt: any) => {
    // Only position view once
    map.getView().animate({
      center: fromLonLat([evt.place.lon, evt.place.lat]),
      zoom: zoomLevelSingleMarker,
    });
  });
  return geocoder;
}

export function requestLocation(data: StoreData) {
  const textInput = document.querySelector(
    '.gcd-txt-input'
  ) as HTMLInputElement;
  const sendTextInput = document.querySelector(
    '.gcd-txt-search'
  ) as HTMLButtonElement;
  if (textInput && sendTextInput) {
    const [postcode, city, houseNumber] = getAddress(data);
    textInput.value = `${postcode}, ${houseNumber}, ${city}`;
    console.log('search street map for', textInput.value);
    sendTextInput.click();
  }
}
