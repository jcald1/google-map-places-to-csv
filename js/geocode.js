import config from './config.js';

import {apiClient} from "./apiClient.js";

const geocode = async (result, currentRecordNumber) => {
    console.log('geocode', result, currentRecordNumber);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?&address=${result.formatted_address}&key=${config.google.apiKey}`;
    console.log('Calling Google API Geocode', url)
    const geocodeResults = await apiClient(url,  currentRecordNumber);
    if (!geocodeResults) {
        console.error(`No geocode results found for address: ${result.formatted_address}`);
        return;
    }

    return geocodeResults;
};

export {
    geocode,
}