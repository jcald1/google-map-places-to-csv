// https://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data
import {downloadFile} from './file.js';

import {updateMessage} from './common.js';

function CSVToArray( strData, strDelimiter ){
    try {
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create a regular expression to parse the CSV values.
        let objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
        );


        // Create an array to hold our data. Give the array
        // a default empty first row.
        let arrData = [[]];

        // Create an array to hold our individual pattern
        // matching groups.
        let arrMatches = null;


        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec(strData)) {

            // Get the delimiter that was found.
            let strMatchedDelimiter = arrMatches[1];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
            ) {

                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push([]);

            }

            let strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[2]) {

                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[2].replace(
                    new RegExp("\"\"", "g"),
                    "\""
                );

            } else {

                // We found a non-quoted value.
                strMatchedValue = arrMatches[3];

            }


            // Now that we have our value string, let's add
            // it to the data array.
            arrData[arrData.length - 1].push(strMatchedValue);
        }

        // Return the parsed data.
        return (arrData);
    }
    catch (err) {
        throw new Error('Error processing the CSV file.  Make sure it starts with "address,phone" and that addresses are in double quotes')
    }
}

const generatePlaceDetailsResultArray = (record, currentRecordNumber, records) => {
    //console.log('generateResultArray', 'record:', record, 'outputRecordNumber', outputRecordNumber, 'records:', records, 'outputRecords:',
    //    outputRecords, 'currentRecordNumber:', lastRecordNumber);

    const newCells = [record['id'], record['formatted_address'], record['international_phone_number'], record['formatted_phone_number'],
        record['geometry']['location']['lat'], record['geometry']['location']['lng'], record['name'],
        record['place_id'], record['url'], record['website'], record['types']];

    return [...records[currentRecordNumber], ...newCells];
};


const escapeStringForCsv = val => {
    if (!val) {
        val = '';
    }
    if (val && typeof val == 'string') {
        return `"${val.replace('"', '""')}"`
    }
    return `"${val}"`;
}

const escapeStringArrForCsv = (arr) => {
    return arr.map(val => {
        return escapeStringForCsv(val);
    });
};

//const generateCsvRecordStr = (record, outputRecordNumber, records, outputRecords, lastRecordNumber) => {
const generatePlaceDetailsResultCsvArr = (record, currentRecordNumber, records) => {
        if (currentRecordNumber===0) {
            return [...record].join(',');
        }
        // const generateResultArr = generateResultArray(record, outputRecordNumber, records, outputRecords, lastRecordNumber);
        const generateResultArr = generatePlaceDetailsResultArray(record, currentRecordNumber, records);
        //console.log('generateCsvRecordStr', 'generateResultArr', generateResultArr, 'outputRecordNumber', outputRecordNumber, 'result:', record,
        //    'outputRecords:', outputRecords, 'lastRecordNumber', lastRecordNumber);

        const resultArrayWithStringEscaping = generateResultArr; // escapeStringArrForCsv(generateResultArr);

        console.log('generateCsvRecordStr', resultArrayWithStringEscaping);
        return resultArrayWithStringEscaping;
};

const generateAndSaveCsv = (err, records, outputRecords, lastRecordNumber, totalRecords) => {
    console.log('generateAndSaveCsv', 'err:', err, 'outputRecords:', outputRecords, 'lastRecordNumber:',
        lastRecordNumber);
    if (!outputRecords || outputRecords.length === 0) {
        updateMessage('No CSVs data generated')
    }

    const rowsWithCommas = outputRecords.map((row) => {
        console.log('row', row);
        return escapeStringArrForCsv(row).join(',');
    });
    console.log('rowsWithCommas', rowsWithCommas, outputRecords, 'outputRecords.length:', outputRecords.length);

    const csvStr = rowsWithCommas.join('\r\n');
    console.log('csvStrNoHeaders', csvStr);

    //console.log('rowsWithCommas', rowsWithCommas, 'csvStrNoHeaders', csvStrNoHeaders);
    //const csv = csvHeaders.join(',') + '\r\n' + csvStrNoHeaders;
    //console.log('csv', csv);

    downloadFile(csvStr, 'data.csv', "text/csv");
    const msg = err ? err.message + `Partial Results Count: ${lastRecordNumber} out of ${totalRecords} total input records. Download Complete.  The CSV should have downloaded or opened in a separate app like Excel or Office Libre if configured in the browser.` :
        `Processing Complete Results Count: ${lastRecordNumber} out of ${totalRecords} total input records. The CSV should have downloaded or opened in a separate app like Excel or Office Libre if configured in the browser.`;
    updateMessage(msg)
};

export {
    CSVToArray,
    generatePlaceDetailsResultCsvArr,
    generateAndSaveCsv,
    escapeStringArrForCsv,
    escapeStringForCsv
}
