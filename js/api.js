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
        const noHeaderArr = csvFileArray.slice(1)
        console.log('noHeaderArr', noHeaderArr)
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

const placeSearch = async (address, phone, csvs, count) => {
    console.log('placeSearch', address, phone, csvs)

    var city = new google.maps.LatLng(config.google.maps.coordinates.lat, config.google.maps.coordinates.lon);

    infowindow = new google.maps.InfoWindow();

    map = new google.maps.Map(
        document.getElementById('map'), {center: city, zoom: config.google.maps.zoom});

    const classesMapping = {
        'findPlaceFromQuery': google.maps.places.PlacesService,
        'findPlaceFromPhoneNumber': google.maps.places.PlacesService
    };

    let apiMethod;
    let request;
    let serviceName;
    if (address) {
        request = {
            query: address,
            fields: ['formatted_address', 'name', 'opening_hours', 'geometry', 'place_id', 'plus_code', 'types'],
        };
        apiMethod = 'findPlaceFromQuery';
    } else {
        const number = phoneUtil.parseAndKeepRawInput(phone, config.country);
        const phoneNumber = phoneUtil.format(number, PNF.E164);
        request = {
            phoneNumber,
            fields: ['formatted_address', 'name', 'opening_hours', 'geometry', 'place_id', 'plus_code', 'types'],
        };
        apiMethod = 'findPlaceFromPhoneNumber';
    }
    console.log('Class', classesMapping[apiMethod], apiMethod, classesMapping)
    const service = new classesMapping[apiMethod](map);

    console.log(`Calling ${apiMethod}`, request)

    return new Promise(async (resolve, reject) => {
        service[apiMethod](request, async (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    console.log('result', results[i]);
                    const result = await placeDetails(results[i], csvs, count)
                    await sleep();
                }
                resolve();
            } else {
                const err = new Error(`Error Calling Search. Status: ${status}`)
                handleError(err)
                reject(err);
            }
        });
    })
}

function timeout() {
    return new Promise(resolve => setTimeout(resolve, config.google.delayMilliseconds));
}
const sleep = async () => {
    await timeout();
}

const generateAndSaveCsv = (err, csvs, count ) => {
    if (!csvs || csvs.length == 0) {
        return updateMessage('No CSVs data generated')
    }

    console.log('$$$$$ csvs', csvs)
    const rowsWithCommas = csvs.map(row => row.join(','))
    console.log('rowsWithCommas', rowsWithCommas, csvs, csvs.length)

    const csvStrNoHeaders = rowsWithCommas.join('\r\n');
    console.log('csvStrNoHeaders', csvStrNoHeaders)

    console.log('rowsWithCommas', rowsWithCommas, 'csvStrNoHeaders', csvStrNoHeaders)
    const csv = generate_csv_headers().join(',') + '\r\n' + csvStrNoHeaders
    console.log('csv', csv)

    downloadFile(csv, 'data.csv', "text/csv");
    const msg = err ? err.message + ` Partial Results Count: ${count}` : `Download Complete.  Total Count: ${count} The CSV should have downloaded or opened up in an an app like Excel`
    updateMessage(msg)
}

const placesSearch = async (apiKey, address, phone, fileContents) => {
    let count = 0;
    const csvs = []
    const results = []

    try {
        console.log('placesSearch', address, phone, 'file length', fileContents && fileContents.length)

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
            const result = await placeSearch(addresses[i], null, csvs, count)
            await sleep();
            results.push(result)
            count += 1;
            const msg = `Calling Google Maps Places.  Called: ${count}`;
            console.log(msg);
            updateMessage(msg);
        }
        for (let i = 0; i < phones.length; i++) {
            console.log('Processing phone', phones[i])
            const result = await placeSearch(null, phones[i], csvs, count)
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

const placeDetails = async (result, csvs, count) => {
    console.log('placeDetails');

    /*
    const request = {
        placeId: result.place_id,
        fields: null //['name', 'formatted_phone_number', 'rating', 'reviews', 'website']
    };
    service.getDetails(request, placeDetailsCb);
    */

    const fields = 'id,formatted_address,international_phone_number,formatted_phone_number,geometry,name,place_id,url,website,types';
    await apiClient(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${result.place_id}&key=${config.google.apiKey}&fields=${fields}`, csvs, count)
}

/*/
  params  url : site that doesn’t send Access-Control-*
 */
const apiClient = (url, csvs) => {
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
                    .then((data) => {
                        console.log(data);
                        console.log(data.result)
                        const csv_row = generate_csv(data.result)
                        csvs.push(csv_row)
                        return csv_row
                    })
                    .catch(err => {
                        console.error(err);
                        //handleError((err))
                        throw err;
                    })
            }
        )
        .catch((err) => {
            console.error(`Fetch Error calling ${url}`, err);
            //handleError(err)
            throw err;
        });
}

const generate_csv_headers = () => {
    return ['id', 'formatted_address', 'international_phone_number', 'formatted_phone_number', 'lat', 'lng', 'name', 'place_id',
        'url', 'website', 'types']
}

const generate_result_array = (result) => {
    return [result['id'], result['formatted_address'], result['international_phone_number'], result['formatted_phone_number'],
        result.geometry.location.lat, result.geometry.location.lng, result['name'],
        result['place_id'], result['url'], result['website'], result['types'].join(',')]
}


const generate_csv = (result) => {
    const arr = generate_result_array(result);
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
    placesSearch,
    handleError
}