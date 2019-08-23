import config from "./config.js";

const PNF = window['libphonenumber'].PhoneNumberFormat
const phoneUtil = window['libphonenumber'].PhoneNumberUtil.getInstance();

var map;
var infowindow;

const placeSearch = (apiKey, address, phone) => {
    try {
        console.log('placeSearch', address, phone)

        clearMessage()

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
        console.log('Class',classesMapping[apiMethod], apiMethod, classesMapping)
        const service = new classesMapping[apiMethod](map);

        console.log(`Calling ${apiMethod}`, request)
        service[apiMethod](request, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    console.log('result', results[i]);
                    placeDetails(results[i])
                }
            } else {
                const err = new Error(`Error Calling Search. Status: ${status}`)
                handleError(err)
            }
        });
    } catch (err) {
        handleError(err)
    }

}

const placeDetails = (result) => {
    console.log('placeDetails');

    /*
    const request = {
        placeId: result.place_id,
        fields: null //['name', 'formatted_phone_number', 'rating', 'reviews', 'website']
    };
    service.getDetails(request, placeDetailsCb);
    */

    apiClient(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${result.place_id}&key=${config.google.apiKey}`)
}

/*/
  params  url : site that doesn’t send Access-Control-*
 */
const apiClient = (url) => {
    const proxyurl = config.corsProxyUrl;

    fetch(proxyurl + url)
        .then(
            function (response) {
                if (response.status !== 200) {
                    console.log(`Looks like there was a problem calling ${url}. Status Code: 
                        ${response.status}`);
                    return;
                }
                console.log('url', url, 'response', response)
                // Examine the text in the response
                response.json()
                    .then(function (data) {
                        console.log(data);
                        console.log(data.result)
                        generate_csv(data.result)
                    })
                    .catch(err => handleError((err)))
            }
        )
        .catch(function (err) {
            console.log(`Fetch Error calling ${url}`, err);
            handleError(err)
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

    const csv = generate_csv_headers().join(',') + '\r\n' + arr2.join(',') + '\r\n'
    console.log('csv', csv)

    downloadFile(csv, 'data.csv', "text/csv");
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

const handleError = (err) => {
    clearMessage()
    document.getElementById('message').innerHTML = err.message;
}

export {
    placeSearch,
    handleError
}