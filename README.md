# Google Maps Places: Get Business Name, Address, Phone Numbers, and Website by Searching by Addresses or Phone Number.  Results are Exported to CSV

This web tool lets you search for business information (name, address, phone number, website, latitude, longitude) by address or phone number using the Google Maps Places API, and returns a list of businesses and information at that address or phone number.

**See the 'Running the Tool' section below for information about browsers supported**

## Setup

1.  Go to `https://developers.google.com/maps/gmp-get-started` and to set up your Google account and Google Maps API Key.  In the 'Getting Started' section, select the 'Maps' and 'Places' checkbox.  Google requires you to set up a billing account.
1. You can manage your account by going to `https://console.cloud.google.com/google/maps-apis`.
1. Copy the generated API Key from the step above.
1. Download this Tool
    1. For Non-Developers:
        1.  Click the `Clone or Download` button here in GitHub.
        1.  Click `Download Zip`
        1.  Extract the Zip file
        1.  To be notified of new versions of the tool, click the 'Watch' icon on this page.
    1. For Developers:
        1. Clone this repo.
 1. Copy the `sample-config.js` file in the `js` directory to `config.js` in the same `js` directory.
 1. In the `apiKey` property, replace the text inside the single quotes with the API Key generated above.
 1. In the coordinates section, add the latitude and longitude of the map you're searching. These properties don't seem to be required. The zoom can be changed if needed.  The zoom levels are in meters and are described in [this page](https://gis.stackexchange.com/questions/7430/what-ratio-scales-do-google-maps-zoom-levels-correspond-to).  To learn more about the options, go to [the Google Maps API documentation](https://developers.google.com/maps/documentation/). 
 1.  If searching by phone number and searching for phone numbers outside of the US, change the country code property in `config.js` with the [two letter country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).  To learn  more about the phone formatter used by this tool, visit the [google libphonenumber page](https://github.com/google/libphonenumber)
 
 ## Running the Tool
 1.  If you're using Firefox, you should be able to just run it in thee browser.  For other browsers, you may need to [set up a local web server](https://gist.github.com/jgravois/5e73b56fa7756fd00b89).  If this link isn't working, just search for 'test local web server'.  
 1.  Navigate to the extracted zip folder and copy the path of the `index.html` file (e.g., `/home/user/Downloads/google-map-places-to-csv/index.html`).  Paste this path into your browser's URL text box.
 1.  Search by either entering in a phone number, an address, or by selecting a CSV file.  The phone numbers don't have to be in any particular format as this tool uses a software library to convert it to a standard format. For addresses, enter in the full address if you have it.  If not, then a partial address may be OK (just like when you enter a partial address in Google Maps)
     1.  For CSV Files, note the following
         1.  The first row has to start with "address,phone"
         1.  You only need the address or the phone number of a place you're looking for.  The results will return both the address and phone number if matches are found (plus all of the other information).
         1.  You can treat the address and phone numbers as two different sets of data.  If a row has both an address and a phone number, they do not need to belong to each other.  Just list out all of your addresses in the first column and all of your phone numbers in the second column.
         1.  If you are just entering in an address in a row, there's no need to have a comma at the end.
         1.  If you are just entering in a phone number and not an address, use this format: `,(999) 999-9999`.  Note the starting comma which reflects an empty string for the first column (address)
         1.  The addresses should be surrounded by double quotes, e.g. `"123 Main St., San Francisco, CA"`.  This prevents the commas in the addresses from messing up the CSV columns.  If the address itself needs a double quote, then replace it with two double quotes next to each other, e.g. `"Attn ""Mr. Rogers"", 123 Main St., San Francisco, CA"`
         1.  If you use a tool like Excel to export the CSV, make sure you pay attention to the options in the export so the rules above are followed. There should be an option to include the header (address,phone) in the CSV output 
 1.  If the tool doesn't seem to work, [look at your console for errors](https://zapier.com/help/troubleshoot/behavior/view-and-save-your-browser-console-logs).