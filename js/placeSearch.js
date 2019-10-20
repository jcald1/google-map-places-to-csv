import config from './config.js';

let map;
let infowindow;

const placeSearch = async (request, currentRecordNumber, address, phone, outputRecords) => {
    console.log('placeSearch', 'request', request, 'currentRecordNumber', currentRecordNumber, 'address', address, 'phone', phone);

    if (!address && !phone) {
        console.error(`No address or phone provided in input record number ${currentRecordNumber}`);
        return Promise.resolve(null);
    }
    var city = new google.maps.LatLng(config.google.maps.coordinates.lat, config.google.maps.coordinates.lon);

    infowindow = new google.maps.InfoWindow();

    map = new google.maps.Map(
        document.getElementById('map'), {center: city, zoom: config.google.maps.zoom});

    const service = new google.maps.places.PlacesService(map);

    console.log(`Calling Google Place Search for record ${currentRecordNumber}`, request);
    return new Promise(async (resolve, reject) => {
        let apiMethod;
        if (request.query) {
            apiMethod = 'findPlaceFromQuery';
        } else {
            apiMethod = 'findPlaceFromPhoneNumber';
        }
        service[apiMethod](request, async (results, status) => {
            if (status === 'ZERO_RESULTS') {
                const errMsg = `No Place Search results address: ${address} phone: ${phone}`;
                console.error(errMsg);
                resolve(null);
            }
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                resolve(results);
            } else {
                const err = new Error(`Error Calling Search. Status: ${status} request: ${request && JSON.stringify(request)}`);
                console.error(err);
                reject(err);
            }
        })
    })
};

export {
    placeSearch
}