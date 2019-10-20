import config from './config.js';

import {apiClient} from "./apiClient.js";
import {generatePlaceDetailsResultCsvArr} from './csv.js';

const getPlaceDetailsHeaders = () => ['id', 'formatted_address', 'international_phone_number', 'formatted_phone_number', 'lat', 'lng', 'name', 'place_id',
    'url', 'website', 'types'];

const placeDetails = async (place_id, currentRecordNumber) => {
    console.log('placeDetails', place_id);

    const fields = 'id,formatted_address,international_phone_number,formatted_phone_number,geometry,name,place_id,url,website,types';

    const url = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${place_id}&key=${config.google.apiKey}&fields=${fields}`;
    console.log('Calling Place Details', url);
    return await apiClient(url, currentRecordNumber);
};

const processPlaceDetailsResponse = (data, lat, lng, records, currentRecordNumber, outputRecords) => {
    console.log('processPlaceDetailsResponse', data, lat, lng, outputRecords);
    const csvRow = generatePlaceDetailsResultCsvArr(data.result, currentRecordNumber, records );

    outputRecords.push(csvRow);

};

export {
    placeDetails,
    processPlaceDetailsResponse,
    getPlaceDetailsHeaders
}