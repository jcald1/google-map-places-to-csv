import {CSVToArray} from "./csv.js";
import config from './config.js';
import {COLUMNS} from './globals.js';

const getFileData = (fileContents, metadata) => {
    const csvFileArray = CSVToArray(fileContents, ',');
    console.log('csvFileArray', csvFileArray);

    csvFileArray.forEach((record, index) => {
        console.log('csvFileArray', csvFileArray, 'record', record, 'index', index)
        if (index === 0) {
            return record.forEach(headerColumn => {
                if (headerColumn === COLUMNS.ADDRESS_COLUMN_STR) {
                    metadata['addressColumnIndex'] = index
                } else if (headerColumn === COLUMNS.PHONE_COLUMN_STR) {
                    metadata['phoneColumnIndex'] = index
                }
            })
        }
    });

    metadata.errorColumnIndex = csvFileArray.length - 1;

    return {metadata, records: csvFileArray};
};

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
};

export {
    getFileData,
    downloadFile
}