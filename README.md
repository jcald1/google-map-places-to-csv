# Google Maps Places: Get Business Name, Address, Phone Numbers, and Website by Searching by Addresses, Phone Number, or Category of Establishement.  Results are Exported to CSV

This web tool lets you search for business information (name, address, phone number, website, latitude, longitude) by address, phone number, or category of establishment using the Google Maps Places API, and returns a list of businesses and information at that address or phone number.


## Setup

1.  Go to [https://developers.google.com/maps/gmp-get-started](https://developers.google.com/maps/gmp-get-started) and to set up your Google account and Google Maps API Key.  In the 'Getting Started' section, select the 'Maps' and 'Places' checkbox.  Google requires you to set up a billing account.
1. You can manage your account by going to [https://console.cloud.google.com/google/maps-apis](https://console.cloud.google.com/google/maps-apis).
1. Copy the generated API Key from the step above.
1. Enable the [Google Custom Search JSON API](https://developers.google.com/custom-search/v1/overview) 
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
 1. In the coordinates section, add the latitude and longitude of the map you're searching, without quotes. For example, a lat/lon in San Francisco is 37.784131, -122.403295.
      The zoom can be changed if needed.  The zoom levels are in meters and are described in [this page](https://gis.stackexchange.com/questions/7430/what-ratio-scales-do-google-maps-zoom-levels-correspond-to).  To learn more about the options, go to [the Google Maps API documentation](https://developers.google.com/maps/documentation/). 
 1.  If searching by phone number and searching for phone numbers outside of the US, change the country code property in `config.js` with the [two letter country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).  To learn  more about the phone formatter used by this tool, visit the [google libphonenumber page](https://github.com/google/libphonenumber)
 
 ## Running the Tool
1. Paste this path into your browser's URL text box.
1. A category of establishment can be used in places of an address. See [https://developers.google.com/maps/documentation/places/web-service/search-find-place](https://developers.google.com/maps/documentation/places/web-service/search-find-place) for more details. While not officially supported, you can also try searching for a business name and city as a single query. If you have multiple columns in your CSV, you can concatenate them in Excel/Libre Office separated by spaces and use the name of that column in place of `address` in the configuration file, as described below.
 1.  Search by either entering in a address, single phone number, or category of establishment, or by selecting a CSV file.  The phone numbers don't have to be in any particular format as this tool uses a software library to convert it to a standard format. For addresses, enter in the full address if you have it.  If not, then a partial address may be OK (just like when you enter a partial address in Google Maps)
     1.  For CSV Files, note the following
         1.  Look at the `sample-config.js` file in the `js` directory for an example.
         1.  By default, you need either one column to contain the name `address` or one column to contain the name `phone`.  These and other values can be changed in the config file (copy `sample-config.js` to `config.js` in the same `js` directory and make changes as needed).
         1.  You only need the address or the phone number of a place you're looking for.  The results will return both the address and phone number if matches are found (plus all of the other information).
         1.  Make sure that any columns with blank data still have commas. For example, for one of your rows, if the first column has a value of "abc" and the second column is blank, the row should be: `abc,`.  Note the trailing comma.  Likewise, if there are two blank cells next to each other, they should contain two commas next to each other: `,,`.  Excel or Libre Office should automatically set this up when exporting to CSV.  Make sure that if a cell contains commas that you surround the text with double quotes: `"text"`.  If the cell contains a double quote, then you need to escape it using two double quotes: `""`.
         1.  Addresses should be surrounded by double quotes, e.g. `"123 Main St., San Francisco, CA"`.  This prevents the commas in the addresses from messing up the CSV columns.  If the address itself needs a double quote, then replace it with two double quotes next to each other, e.g. `"Attn ""Mr. Rogers"", 123 Main St., San Francisco, CA"`
         1.  If you use a tool like Excel or Libre Office to export the CSV, make sure you pay attention to the options in the export so the rules above are followed. There should be an option to include the header (address,phone) in the CSV output.
 1.  This tool does a "Search Places", "Geocode", and "Search Details" call on every address or phone number serially. Since the calls aren't going out in parallel, this means that it can take a long time for a CSV file to be processed.
 1.  The maximum number of results for any given address or phone number is currently 20.  Google lets you query additional results (up to 60), but this tool doesn't do that.
 1.  To prevent CORS errors in the browser, the easier thing to do would be to run a local web server using one of these methods:
    1. Try it in Firefox first. Otherwise, use one of the following options
        Add the full path of the  `index.html` file (e.g., `/home/user/Downloads/google-map-places-to-csv/index.html`) to the URL bar. 
    1. Or run a local web server using Python:
        From the root directory of the tool, execute: `python3 -m http.server 8000`.
    1. Or download and run a web server:
        In the root directory of the tool:
        [set up a local web server](https://gist.github.com/jgravois/5e73b56fa7756fd00b89).  If this link isn't working, just search for 'test local web server'.  Those instructions should tell you how to set up the web server on your system, copy in the contents of the extracted zip directory to the web server's directory of web files, start the web server, and open the tool in the browser according to the instructions in the web server.
 1.  If you see an error related to CORS, change the settings on browser to get around the CORS error.  [This site](http://testingfreak.com/how-to-fix-cross-origin-request-security-cors-error-in-firefox-chrome-and-ie/) has instructions on how to do that or just search for "fix CORS" and the name of your browser (firefox, safari, chrome, etc.).    Firefox may work better than the other browsers and can be set up to work without a web server.
    1. To use a CORS server, use the `corsProxyUrl` configuration property. Note that if using the CORS Anywhere demo service (`https://cors-anywhere.herokuapp.com/`), you have to now opt in to receive temporary access. There are rate limits on this server. Go here to for more details: [https://github.com/Rob--W/cors-anywhere](https://github.com/Rob--W/cors-anywhere).
    1. Alternatively, you can run your own CORS server locally. Go to [https://github.com/Rob--W/cors-anywhere](https://github.com/Rob--W/cors-anywhere), run the server, then point your configuration to the local CORS server.
 1.  After entering in an address, phone number, or CSV, if the tool doesn't seem to do anything, [check your console for errors](https://zapier.com/help/troubleshoot/behavior/view-and-save-your-browser-console-logs). If this link doesn't work, search for 'check console' and the name of your browser (firefox, safari, chrome, etc.).
 1.  If you get a `OVER_QUERY_LIMIT` error message on the page, try increasing the `delayMilliseconds` configuration value in the config.js.
 1.  In the config.js, there are properties called `nearbySearchStopAtFirstMatch`, `placeSearchStopAtFirstMatch`, and `geocodeStopAtFirstMatch`.   If these are set to "true" then the tool won't try to find additional matches for the respective Google API call.  This can save you money, but you could miss out on results, for example, if there are suites in your address and you searched for an address without the suite specified.
 1.  The `geocodeRadiusMeters` property can be tweaked if needed.  When the address is geocoded, the tool does a separate search to get businesses within a radius from that location.  The higher the number, the more results you'll get, but it will also cost more.  The number of results is also capped, so it is often better to use a smaller number to ensure that the best result(s) are returned.
 1. Lets say you search out a 20 meter radius and it comes back with 10 results.  The tool is going to make a Place Details request on each one of those results, which can get expensive.  If you want it to just quit once it finds the first address, keep that set to true. 
    
    For example, in order to get both the Starbucks and the Target to come back in the search by "789 Mission St, San Francisco, CA 94103", I had to set `nearbySearchStopAtFirstMatch` to false and have geocodeRadiusMeters at 20.  Even if two businesses are at the same exact address,  Google knows when they are in slightly different physical locations (e.g., different businesses in a mall that happen to share the same address).
    
    To really save money, I would set `geocodeRadiusMeters` to 1, then you might as well leave `nearbySearchStopAtFirstMatch`, `placeSearchStopAtFirstMatch`, and`geocodeStopAtFirstMatch` set to false in case another business is physically in the same exact location.The main thing is to not have to make so many Place Detail calls for every address, which happens when you use larger values for geocodeRadiusMeters.
    
     If you want the output CSV to have a one-to-one match with the input records, set the `nearbySearchStopAtFirstMatch`, `placeSearchStopAtFirstMatch`, and `geocodeStopAtFirstMatch` values all to "true".  While the output should match one-to-one, it's possible that there are bugs in the tool and some records are dropped, so compare the input and output records to make sure there is a one-to-one match.
     
     There is an `errorMessage` column that lists specific errors that occurred for a record.  These errors have to do with the data in the response (e.g., no matching address found).  The tool continues on the next records in the input CSV file.  You can always search for these addresses or phone numbers manually in maps.google.com to see if you can retrieve any results, or tweak the configuration settings and try again.
     
     If there is a networking or similar error, then the tool halts and you are able to download the results generated up to that point.  You can delete part of the records from the input file that were already processed and try the rest of the records, and combine the output files once they are all finished processing.
1. Use the `cacheTheSearchField` configuration property if there's a chance that a search value will be repeated in other input rows.