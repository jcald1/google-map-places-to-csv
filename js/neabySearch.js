import config from './config.js';
import {generateNewOutputRecord} from "./common.js";
import {apiClient} from "./apiClient.js";

const nearbySearch = async (lat, lng, records, metadata, outputRecords, currentRecordNumber) => {
    console.log('nearbySearch', lat, lng, records, metadata, outputRecords, currentRecordNumber);

    const fields = 'name,vicinity,place_id';

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&fields=${fields}&radius=${config.google.geocodeRadiusMeters}&key=${config.google.apiKey}`;
    console.log('Calling Nearby Search', url);
    const nearbySearch = await apiClient(url, currentRecordNumber);
    console.log('nearbySearch', nearbySearch);
    if (!nearbySearch) {
        const errMsg =`No Nearby Search results found for lat/lon: ${lat}/${lng} record ${currentRecordNumber}`;
        console.log(errMsg);
        const outputRecord = generateNewOutputRecord(records, currentRecordNumber, metadata, metadata.errorColumnIndex, errMsg, true);
        outputRecords.push(outputRecord);
        return;
    }

    return nearbySearch;
};

export {
    nearbySearch
}