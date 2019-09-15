import config from "./config.js";
import {CSVToArray} from "./csv.js"

const PNF = window['libphonenumber'].PhoneNumberFormat
const phoneUtil = window['libphonenumber'].PhoneNumberUtil.getInstance();

var map;
var infowindow;


const getFileData = (fileContents) => {
    const csvFileArray = CSVToArray(fileContents, ',');
    console.log('csvFileArray', csvFileArray);

    const addresses = [];
    const phones = [];
    if (csvFileArray[0] && csvFileArray[0][0] === 'address' && csvFileArray[0][1] === 'phone') {
        const noHeaderArr = csvFileArray.slice(1);
        console.log('noHeaderArr', noHeaderArr);
        noHeaderArr.map(row => {
            console.log('row', row)
            if (row[0]) {
                addresses.push(row[0])
            }
            if (row[1]) {
                phones.push(row[1])
            }
        })
        return {addresses, phones}
    } else {
        throw new Error('The CSV file does not appear to be correct.  Error processing the CSV file.  Make sure it starts with "address,phone" and that addresses are in double quotes')
    }
}

const placeSearch = async (request, csvs, count) => {
    console.log('placeSearch', csvs)

    var city = new google.maps.LatLng(config.google.maps.coordinates.lat, config.google.maps.coordinates.lon);

    infowindow = new google.maps.InfoWindow();

    map = new google.maps.Map(
        document.getElementById('map'), {center: city, zoom: config.google.maps.zoom});

    const service = new google.maps.places.PlacesService(map);

    console.log(`Calling Place Search`, request)
    return new Promise(async (resolve, reject) => {
        let apiMethod;
        if (request.query) {
            apiMethod = 'findPlaceFromQuery';
        }
        else {
            apiMethod = 'findPlaceFromPhoneNumber';
        }
        service[apiMethod](request, async (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                resolve(results);
            } else {
                const err = new Error(`Error Calling Search. Status: ${status}`);
                console.error(err);
                reject(err);
            }
        })
    })
        .catch(err => {
                console.error('Error calling Place Seach', err);
                throw err;
            }
        )
}

const placeSearchForUserAddressOrPhoneNumber = async (user_address, user_phone, csvs, count) => {
    console.log('placeSearchForUserAddressOrPhoneNumber', user_address, user_phone, csvs);

    let request;
    const fields = ['formatted_address', 'name', 'opening_hours', 'geometry', 'place_id', 'plus_code', 'types']
    //const fields = ['formatted_address', 'name']
    if (user_address) {
        request = {
            query: user_address,
            fields,
        };
    } else {
        const number = phoneUtil.parseAndKeepRawInput(user_phone, config.country);
        const formattedPhoneNumber = phoneUtil.format(number, PNF.E164);
        request = {
            phoneNumber: formattedPhoneNumber,
            fields,
        };
    }

    const placeSearchResults = await placeSearch(request, csvs, count).catch(err => {
        console.log(err);
        throw err
    });
    console.log('placeSearchResults', placeSearchResults)
    console.log('Trimming placeSearchResults');
    let formattedAddresses = {};
    placeSearchResults.forEach(placeSearchResult => formattedAddresses[placeSearchResult.formatted_address] = placeSearchResult);
    const trimmedPlaceSearchResults = Object.values(formattedAddresses);
    console.log('trimmedPlaceSearchResults',trimmedPlaceSearchResults);

    for (var i = 0; i < trimmedPlaceSearchResults.length; i++) {
        console.log('placeSearchResults', trimmedPlaceSearchResults[i]);
        const placeSearchFormattedAddress = placeSearchResults[i].formatted_address;
        console.log('formatted address from place search', placeSearchFormattedAddress);

        if (!trimmedPlaceSearchResults[i].formatted_address) {
            console.log(`No address returned for place search result: ${trimmedPlaceSearchResults[1]}`);
            continue;
        }
        const geocodeResults = await geocode(trimmedPlaceSearchResults[i], csvs, count);
        console.log('geocodeResults', geocodeResults);
        await sleep();

        if (geocodeResults.status === 'ZERO_RESULTS') {
            console.log(`No Place Search results for ${request}`);
            continue;
        } else if (geocodeResults.status !== 'OK') {
            throw new Error(`Place Search Result error. Status: ${trimmedPlaceSearchResults.status}`);
        }

        for (let i = 0; i < geocodeResults.results.length; i++) {
            const lat = geocodeResults.results[i]['geometry'] && geocodeResults.results[i]['geometry']['location'] && geocodeResults.results[i]['geometry']['location']['lat'];
            const lng = geocodeResults.results[i]['geometry'] && geocodeResults.results[i]['geometry']['location'] && geocodeResults.results[i]['geometry']['location']['lng'];

            if (!lat || !lng) {
                console.error('No geocode lat/lon found',  geocodeResults.results[i]);
                continue;
            }

            const nearbySearchResults = await nearbySearch(lat, lng, csvs, count);
            console.log('nearbySearchResults', nearbySearchResults);
            await sleep();
            if (nearbySearchResults.status === 'ZERO_RESULTS') {
                console.log('No Nearby Places  results', lat,);
                continue;
            } else if (nearbySearchResults.status !== 'OK') {
                throw new Error(`Place Search Result error. Status: ${nearbySearchResults.status}`);
            }

            let formattedAddressMatched = false;
            for (let j = 0; j < nearbySearchResults.results.length; j++) {
                const placeDetailsResults = await placeDetails(nearbySearchResults.results[j].place_id, csvs, count);
                console.log('placeDetailsResults', placeDetailsResults);
                if (placeDetailsResults.status === 'ZERO_RESULTS') {
                    console.log(`No Place Details results for ${nearbySearchResults.results[j].place_id}`);
                    continue;
                } else if (placeDetailsResults.status !== 'OK') {
                    throw new Error(`Place Details Result error. Status: ${placeDetailsResults.status}`);
                }
                const placeDetailsFormattedAddress = placeDetailsResults.result['formatted_address'];

                console.log('Place Search Formatted Addresss', placeSearchFormattedAddress, 'Place Details Formatted Address', placeDetailsFormattedAddress)
                if (placeDetailsFormattedAddress !== placeSearchFormattedAddress) {
                    continue;
                } else if (config.google.nearbySearchStopAtFirstMatch && formattedAddressMatched) {
                    console.log(`One Nearby Search already matched and nearbySearchStopAtFirstMatch set to true in the configuration.  Skipping the rest of the Nearby Search results`);
                    break;
                }
                formattedAddressMatched = true;

                processPlaceDetailsResponse(placeDetailsResults, lat, lng, csvs);

                await sleep();
            }


        }

    }
};


function timeout() {
    return new Promise(resolve => setTimeout(resolve, config.google.delayMilliseconds));
}

const sleep = async () => {
    await timeout();
}

const generateAndSaveCsv = (err, csvs, count) => {
    console.log('generateAndSaveCsv', err, csvs, count)
    if (!csvs || csvs.length == 0) {
        return updateMessage('No CSVs data generated')
    }

    console.log('$$$$$ csvs', csvs);
    const rowsWithCommas = csvs.map(row => row.join(','))
    console.log('rowsWithCommas', rowsWithCommas, csvs, csvs.length)

    const csvStrNoHeaders = rowsWithCommas.join('\r\n');
    console.log('csvStrNoHeaders', csvStrNoHeaders)

    console.log('rowsWithCommas', rowsWithCommas, 'csvStrNoHeaders', csvStrNoHeaders)
    const csv = generate_csv_headers().join(',') + '\r\n' + csvStrNoHeaders
    console.log('csv', csv)

    downloadFile(csv, 'data.csv', "text/csv");
    const msg = err ? err.message + ` Partial Results Count: ${count}` : `Download Complete.  Total Count: ${count} The CSV should have downloaded or opened in a separate app like Excel if your browser is configured to do so.`
    updateMessage(msg)
}

const callGoogle = async (apiKey, address, phone, fileContents) => {
    let count = 0;
    const csvs = []
    const results = []

    try {
        console.log('callGoogle', address, phone, 'file length', fileContents && fileContents.length)

        clearMessage()

        let addresses = []
        let phones = []
        const files = []

        if (address) {
            addresses.push((address))
        }
        if (phone) {
            phones.push((phone))
        }
        if (fileContents) {
            const fileData = getFileData(fileContents)
            if (fileData.addresses) {
                addresses = addresses.concat(fileData.addresses)
            }
            if (fileData.phones) {
                phones = phones.concat(fileData.phones)
            }
        }
        console.log('Processing data', 'addresses', addresses, 'phones', phones)

        updateMessage('Calling Google Maps Places')

        for (let i = 0; i < addresses.length; i++) {
            console.log('Processing address', addresses[i])
            const result = await placeSearchForUserAddressOrPhoneNumber(addresses[i], null, csvs, count);
            await sleep();
            results.push(result)
            count += 1;
            const msg = `Calling Google Maps Places.  Called: ${count}`;
            console.log(msg);
            updateMessage(msg);
        }
        for (let i = 0; i < phones.length; i++) {
            console.log('Processing phone', phones[i])
            const result = await placeSearchForUserAddressOrPhoneNumber(null, phones[i], csvs, count)
            await sleep();
            results.push(result)
            count += 1;
            const msg = `Calling Google Maps Places.  Called: ${count}`;
            console.log(msg);
            updateMessage(msg);
        }

        generateAndSaveCsv(null, csvs, count)

    } catch (err) {
        handleError(err, count)
        console.error(err)
        generateAndSaveCsv(err, csvs, count)
    }

}


const nearbySearch = async (lat, lon, csvs, count) => {
    console.log('nearbySearch', lat, lon, csvs, count);

    const fields = 'name,vicinity,place_id';

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&fields=${fields}&radius=${config.google.geocodeRadiusMeters}&key=${config.google.apiKey}`;
    console.log('Calling Nearby Search', url);
    const nearbySearch = await apiClient(url, csvs, count);
    console.log('nearbySearch', nearbySearch);
    if (!nearbySearch) {
        console.error(`No Nearby Search results found for lat/lon: ${lat}/${lon}`);
        return;
    }

    return nearbySearch;
}

const geocode = async (result, csvs, count) => {
    console.log('geocode', result, csvs, count);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?&address=${result.formatted_address}&key=${config.google.apiKey}`;
    console.log('Calling geocode', url)
    const geocodeResults = await apiClient(url, csvs, count);
    if (!geocodeResults) {
        console.error(`No geocode results found for address: ${result.formatted_address}`);
        return;
    }

    return geocodeResults;
}

const placeDetails = async (place_id, csvs, count) => {
    console.log('placeDetails', place_id);

    const fields = 'id,formatted_address,international_phone_number,formatted_phone_number,geometry,name,place_id,url,website,types';

    const url = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${place_id}&key=${config.google.apiKey}&fields=${fields}`
    console.log('Calling Place Details', url)
    return await apiClient(url, csvs, count);
}

const processPlaceDetailsResponse = (data, lat, lng, csvs) => {
    console.log('processPlaceDetailsResponse', data, lat, lng, csvs);
    const csv_row = generate_csv(data.result, lat, lng);
    csvs.push(csv_row);
    return csv_row;
};

/*/
  params  url : site that doesn’t send Access-Control-*
 */
const apiClient = (url, csvs, count) => {
    const proxyurl = config.corsProxyUrl;

    return fetch(proxyurl + url)
        .then(
            (response) => {
                if (response.status !== 200) {
                    const err = new Error(`Looks like there was a problem calling ${url}. Status Code: 
                        ${response.status}`)
                    console.error(err);
                    throw err;
                }
                console.log('url', url, 'response', response)
                // Examine the text in the response
                return response.json()

                    .catch(err => {
                        console.error(err);
                        throw err;
                    })
            }
        )
        .catch((err) => {
            console.error(`Fetch Error callplaceSearching ${url}`, err);
            //handleError(err)
            throw err;
        });
}

const generate_csv_headers = () => {
    return ['id', 'formatted_address', 'international_phone_number', 'formatted_phone_number', 'lat', 'lng', 'name', 'place_id',
        'url', 'website', 'types']
};

const generate_result_array = (result, lat, lng) => {
    console.log('generate_result_array', result, lat, lng);
    return [result['id'], result['formatted_address'], result['international_phone_number'], result['formatted_phone_number'],
        lat, lng, result['name'],
        result['place_id'], result['url'], result['website'], result['types'].join(',')]
};


const generate_csv = (result, lat, lng) => {
    const arr = generate_result_array(result, lat, lng);
    console.log('generate_csv', arr)

    const arr2 = arr.map(val => {
        //console.log('val', val)
        if (val && typeof val == 'string') {
            return `"${val.replace('"', '""')}"`
        }
        return val;
    });
    console.log('generate_csv returning', arr2)
    return arr2
}

const placeDetailsCb = (place, status) => {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        console.log('place', place)
    } else {
        console.log(`Place Details Response not OK. Status: ${status}`)
    }
}

const downloadFile = (data, fileName, type = "text/csv") => {
    // Create an invisible A element
    const a = document.createElement("a");
    a.style.display = "none";
    document.body.appendChild(a);

    // Set the HREF to a Blob representation of the data to be downloaded
    a.href = window.URL.createObjectURL(
        new Blob([data], {type})
    );

    // Use download attribute to set set desired file name
    a.setAttribute("download", fileName);

    // Trigger the download by simulating click
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
}

const clearMessage = () => {
    document.getElementById('message').innerHTML = '';
    document.getElementById('address').value = '';
    document.getElementById('phone').value = '';
}

const handleError = (err, count) => {
    clearMessage()
    document.getElementById('message').innerHTML = `${err.message} Called: ${count}`;
}

const updateMessage = (message) => {
    //clearMessage()
    document.getElementById('message').innerHTML = message;
}
export {
    handleError,
    callGoogle
}