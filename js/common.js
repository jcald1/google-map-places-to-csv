import config from './config.js';
import {getPlaceDetailsHeaders} from './placeDetails.js';
import {escapeStringForCsv} from './csv.js';

const timeout = () => {
    return new Promise(resolve => setTimeout(resolve, config.google.delayMilliseconds));
};

const generateNewOutputRecord = (records, currentRecordNumber, metadata, columnNumber, value, fillPlaceDetailsWithEmptyStrings) => {
    let placeDetailsCommas = [];
    if (fillPlaceDetailsWithEmptyStrings) {
        placeDetailsCommas = Array(getPlaceDetailsHeaders().length).fill('');
    }

    // console.log('!!!records',records);
    const outputRecord = [...records[currentRecordNumber], ...placeDetailsCommas];
    outputRecord[columnNumber] = value; // escapeStringForCsv(value);
    // console.log('!!!records outputRecord',outputRecord);
    return outputRecord;
};

const sleep = async () => {
    await timeout();
};

const updateMessage = (message) => {
    //clearMessage()
    document.getElementById('message').innerHTML = message;
};

export {
    generateNewOutputRecord,
    sleep,
    updateMessage
}
