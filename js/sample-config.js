const config = {
    google: {
        apiKey: '*** REPLACE TEXT INSIDE THE QUOTES WITH YOUR GOOGLE MAPS API KEY ***',
        maps: {
            zoom: 15,
            coordinates: {
                lat: '***** REPLACE TEXT INSIDE THE QUOTES WITH THE LATITUDE OF THE MAP YOU WANT TO SEARCH WITHOUT QUOTES, EXAMPLE: 37.784131 ******',
                lon: '***** REPLACE TEXT INSIDE THE QUOTES WITH THE LONGITUDE OF THE MAP YOU WANT TO SEARCH WITHOUT QUOTES, EXAMPLE: -122.403295 *****'
            },
        },
        delayMilliseconds: 500,
        geocodeRadiusMeters: 5,
        placeSearchStopAtFirstMatch: true,
        nearbySearchStopAtFirstMatch: true,
        geocodeStopAtFirstMatch: true,
        preferSearchByPhoneToSearchByAddress: true,
        addressColumnName: "address",
        phoneNumberColumnName: "phone",
        cacheTheSearchField: true
    },

    corsProxyUrl: 'https://cors-anywhere.herokuapp.com/',
    country: 'US'
};

export default config;
