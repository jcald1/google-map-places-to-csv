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
 1.  This tool doesn't have a backend server.  If you're using Firefox, you should be able to just run it in thee browser.  For other browsers, you may need to [set up a local web server](https://gist.github.com/jgravois/5e73b56fa7756fd00b89).  If this link isn't working, just search for 'test local web server'.
 1. Open a browser window and point to the `index.html` page.
 1. If the tool doesn't seem to work, [look at your console for errors](https://zapier.com/help/troubleshoot/behavior/view-and-save-your-browser-console-logs).