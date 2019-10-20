import config from "./config.js";

const COLUMNS = {
    ERROR_MESSAGE_STR: 'errorMessage',
    ADDRESS_COLUMN_STR:  config.google.addressColumnName,
    PHONE_COLUMN_STR: config.google.phoneNumberColumnName,
};

export {
    COLUMNS
}