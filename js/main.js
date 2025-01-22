import { getFileData } from "./file.js";
import { generateNewOutputRecord, sleep, updateMessage } from "./common.js";
import { generateAndSaveCsv } from "./csv.js";
import config from "./config.js";
import { geocode } from "./geocode.js";
import { nearbySearch } from "./neabySearch.js";
import { placeDetails, processPlaceDetailsResponse, getPlaceDetailsHeaders } from "./placeDetails.js";
import { placeSearch } from "./placeSearch.js";
import { COLUMNS } from './globals.js';

const PNF = window['libphonenumber'].PhoneNumberFormat;
const phoneUtil = window['libphonenumber'].PhoneNumberUtil.getInstance();

const clearMessage = () => {
    document.getElementById('message').innerHTML = '';
    document.getElementById('address').value = '';
    document.getElementById('phone').value = '';
};

const handleError = (err, count) => {
    clearMessage();
    document.getElementById('message').innerHTML = `${err.message} Called: ${count}`;
};

const queryField = (request) => (request.query || request.phoneNumber);

const processRecord = async (records, metadata, currentRecordNumber, outputRecords) => {
    console.log('processRecord', 'records', records, 'metadata', metadata, 'currentRecordNumber',
        currentRecordNumber, 'outputRecords:', outputRecords);

    let request;
    const fieldsPlaceSearch = ['formatted_address', 'name', 'place_id'];

    let address = '';
    let phone = '';
    if (currentRecordNumber === 0) {
        // outputRecords[0] = [...records[currentRecordNumber], ...additionalColumnsPlaceSearch[currentRecordNumber]];
        outputRecords[0] = [...records[0]];
    } else if (records[currentRecordNumber][metadata.addressColumnIndex] && (!records[currentRecordNumber][metadata.phoneColumnIndex] || config.google.preferSearchByPhoneToSearchByAddress)) {
        console.log('Using address column address:', 'records[currentRecordNumber]:', records[currentRecordNumber], 'metadata.addressColumnIndex:', metadata.addressColumnIndex, records[currentRecordNumber][metadata.addressColumnIndex]);
        address = records[currentRecordNumber][metadata.addressColumnIndex];
        request = {
            query: address,
            fields: fieldsPlaceSearch,
        };
    } else if (records[currentRecordNumber][metadata.phoneColumnIndex] && (!records[currentRecordNumber][metadata.addressColumnIndex] || !config.google.preferSearchByPhoneToSearchByAddress)) {
        const number = phoneUtil.parseAndKeepRawInput(records[currentRecordNumber][metadata.phoneColumnIndex], config.country);
        const formattedPhoneNumber = phoneUtil.format(number, PNF.E164);
        console.log('Using phone column phone:', records[currentRecordNumber][metadata.phoneColumnIndex]);
        phone = formattedPhoneNumber;
        request = {
            phoneNumber: phone,
            fields: fieldsPlaceSearch,
        };
    }

    if (!address && !phone) {
        const errMsg = 'Neither address nor phone was provided in the query. Could be a blank row.  Or check that the input file and config file match on at least one column ';
        console.warn(errMsg);
        return;
    }

    if (config.cacheTheSearchField) {
        if (sessionStorage.getItem(queryField(request))) {
            console.log('Using Cached Results ', request.query || request.phoneNumber);
            return outputRecords.push(sessionStorage.getItem(queryField(request)));
        }
    }

    const placeSearchResults = await placeSearch(request, currentRecordNumber, address, phone, outputRecords).catch(err => {
        console.log(err);
        throw err;
    });

    console.log('placeSearchResults', placeSearchResults);

    if (!placeSearchResults) {
        const errMsg = `No Place Search results returned for phone: ${phone} address: ${address}`;
        const outputRecord = generateNewOutputRecord(records, currentRecordNumber, metadata, metadata.errorColumnIndex, errMsg, true);
        return outputRecords.push(outputRecord);
    }

    console.log('Reducing duplicates in placeSearchResults formatted addresses');
    let formattedAddresses = {};
    placeSearchResults.forEach(placeSearchResult => formattedAddresses[placeSearchResult.formatted_address] = placeSearchResult);
    const deduplicatedFormattedAddressesPlaceSearchResults = Object.values(formattedAddresses);
    console.log('deduplicatedFormattedAddressesPlaceSearchResults', deduplicatedFormattedAddressesPlaceSearchResults);

    let lastErr = null;
    let oneResultMatched = false;
    for (let i = 0; i < deduplicatedFormattedAddressesPlaceSearchResults.length; i++) {
        if (oneResultMatched && config.google.placeSearchStopAtFirstMatch) {
            console.log('Stopping Place Seach processing at first match as configured.');
            break;
        }

        const placeSearchFormattedAddress = deduplicatedFormattedAddressesPlaceSearchResults[i].formatted_address;
        console.log('formatted address from place search', placeSearchFormattedAddress);

        if (!placeSearchFormattedAddress) {
            const errMsg = `No address returned for place search result: ${placeSearchFormattedAddress}`;
            const err = new Error(errMsg);
            console.error(err);
            lastErr = err;
            continue;
        }
        const geocodeResults = await geocode(placeSearchResults[i], currentRecordNumber);
        console.log('geocodeResults', geocodeResults, 'currentRecordNumber', currentRecordNumber);
        await sleep();

        if (geocodeResults.status === 'ZERO_RESULTS') {
            const errMsg = `No Place Search results for ${request}`;
            const err = new Error(errMsg);
            console.error(err);
            lastErr = err;
            continue;
        } else if (geocodeResults.status !== 'OK') {
            throw new Error(`Place Search Result error. Status: ${geocodeResults.status}`);
        }
        else {
            lastErr = null;
        }

        for (let j = 0; j < geocodeResults.results.length; j++) {
            if (oneResultMatched && config.google.geocodeStopAtFirstMatch) {
                console.log('Stopping Geocode processing at first match as configured.');
                break;
            }

            const lat = geocodeResults.results[j]['geometry'] && geocodeResults.results[j]['geometry']['location'] && geocodeResults.results[j]['geometry']['location']['lat'];
            const lng = geocodeResults.results[j]['geometry'] && geocodeResults.results[j]['geometry']['location'] && geocodeResults.results[j]['geometry']['location']['lng'];

            if (!lat || !lng) {
                const errMsg = `No geocode lat/lon found. Formatted address: ${placeSearchFormattedAddress} Geocode Result: ${geocodeResults.results[j] && JSON.stringify(geocodeResults.results[j])}`;
                const err = new Error(errMsg);
                console.error(err);
                lastErr = err;
                continue;
            }

            const nearbySearchResults = await nearbySearch(lat, lng, records, metadata, outputRecords, currentRecordNumber);
            console.log('nearbySearchResults', nearbySearchResults);

            await sleep();

            if (nearbySearchResults.status === 'ZERO_RESULTS') {
                const errMsg = `No Nearby Places  results lat: ${lat} lng: ${lng}`;
                console.error(errMsg);
                const outputRecord = generateNewOutputRecord(records, currentRecordNumber, metadata, metadata.errorColumnIndex, errMsg, true);
                // TODO: Move setItem to calling function, remove other places it's set, and only pass in the one record. Also get the ones without a return, just setting the output record
                sessionStorage.setItem(queryField(request), outputRecord);
                outputRecords.push(outputRecord);
                continue;
            } else if (nearbySearchResults.status !== 'OK') {
                throw new Error(`Nearby Search Result error. Status: ${nearbySearchResults.status} record: ${currentRecordNumber} lat: ${lat} lng: ${lng}`);
            }
            else {
                lastErr = null;
            }

            for (let k = 0; k < nearbySearchResults.results.length; k++) {
                if (oneResultMatched && config.google.nearbySearchStopAtFirstMatch) {
                    console.log('Stopping Nearby Search processing at first match as configured.');
                    break;
                }

                const placeDetailsResults = await placeDetails(nearbySearchResults.results[k].place_id, currentRecordNumber);
                console.log('placeDetailsResults', placeDetailsResults);
                if (placeDetailsResults.status === 'ZERO_RESULTS') {
                    const errMsg = `No Place Details results for ${nearbySearchResults.results[k].place_id}`;
                    const err = new Error(errMsg);
                    console.error(err);
                    lastErr = err;
                    continue;
                } else if (placeDetailsResults.status !== 'OK') {
                    throw new Error(`Place Details Result error. Status: ${placeDetailsResults.status} record: ${currentRecordNumber}`);
                }
                else {
                    lastErr = null;
                }

                const placeDetailsFormattedAddress = placeDetailsResults.result['formatted_address'];

                if (placeDetailsFormattedAddress !== placeSearchFormattedAddress) {
                    console.log(`Place Search Formatted Addresss ${placeSearchFormattedAddress} doesn't match Place Details Formatted Address: ${placeDetailsFormattedAddress}. Skipping`);
                    continue;
                }
                console.log(`Formatted address from Place Search matches Place Details Formatted Address: ${placeSearchFormattedAddress}`);

                oneResultMatched = true;
                processPlaceDetailsResponse(placeDetailsResults, lat, lng, records, currentRecordNumber, outputRecords);

                await sleep();
            } // nearbySearchResults
        } // geocodeResults
    } // deduplicatedFormattedAddressesPlaceSearchResults

    if (!oneResultMatched) {
        const errMsg = (lastErr && lastErr.message) || 'No matches';
        console.error(errMsg);
        const outputRecord = generateNewOutputRecord(records, currentRecordNumber, metadata, metadata.errorColumnIndex,
            errMsg, true);
        sessionStorage.setItem(queryField(request), outputRecord);
        outputRecords.push(outputRecord);

    }
};

const processData = async (apiKey, address, phone, fileContents) => {
    let outputRecords = [];
    let currentRecordNumber = 0;
    let records = [];
    try {
        console.log('processData', 'address:', address, 'phone:', phone, 'file length:', fileContents && fileContents.length)

        clearMessage();

        let metadata = {};

        if (address || phone) {
            records = [["address", "phone", COLUMNS.ERROR_MESSAGE_STR]];
            outputRecords[0] = [...records[0],];
            metadata.addressColumnIndex = 0;
            metadata.phoneColumnIndex = 1;
            metadata.errorColumnIndex = outputRecords[0].length - 1;
            let record = {};
            if (address) {
                record = [address, null, null];
                records.push(record);
            } else if (phone) {
                record = [null, phone, null];
                records.push(record);
            }
        } else if (fileContents) {
            const fileContentsData = getFileData(fileContents, metadata);
            records = fileContentsData.records;
            metadata = fileContentsData.metadata;

            records = records.map((record, idx) => {
                if (idx === 0) {
                    return [...record, COLUMNS.ERROR_MESSAGE_STR];
                }
                return [...record, ''];
            });

            outputRecords[0] = [...records[0],];
            metadata.addressColumnIndex = outputRecords[0].indexOf(config.google.addressColumnName);
            metadata.phoneColumnIndex = outputRecords[0].indexOf(config.google.phoneNumberColumnName);
            metadata.errorColumnIndex = outputRecords[0].length - 1;
        }
        if (!metadata || !Object.keys(metadata).length) {
            throw new Error(`Internal Server Error.  No metadata`);
        }
        if (!records || !Object.keys(records).length) {
            throw new Error(`Internal Server Error.  No records`);
        }

        outputRecords[0] = [...outputRecords[0], ...getPlaceDetailsHeaders()];


        console.log('Processing data', 'metadata', metadata, 'records', records);

        for (let i = 0; i < records.length; i++) {
            if (i === 0) {
                console.log('Skipping header row');
                continue;
            }

            address = records[i][metadata.addressColumnIndex] ? records[i][metadata.addressColumnIndex] : '';
            phone = records[i][metadata.phoneColumnIndex] ? records[i][metadata.phoneColumnIndex] : '';

            const msg = `Processing record number: ${i} address: \
            
             ${address} phone: \
             ${phone}`;
            console.log(msg);
            updateMessage(msg);

            await processRecord(records, metadata, i, outputRecords);
            await sleep();
            currentRecordNumber += 1;
        }

        generateAndSaveCsv(null, records, outputRecords, currentRecordNumber, records.length - 1);

    } catch (err) {
        handleError(err, null);
        console.error(err);
        generateAndSaveCsv(err, records, outputRecords, currentRecordNumber, records.length - 1);
    }
    finally {
        sessionStorage.clear();
    }
};

export {
    handleError,
    processData,
    processRecord
}