import config from "./config.js";

import {processData, handleError} from "./main.js";

const init = () => {
    console.log('init');
    console.log('apiKey', config.google.apiKey);

    window.onerror = function (msg, url, line) {
        const err = `Uncaught Exception: ${msg} ${url} ${line}`;
        console.error(err);
        // handleError(err);
    };


    const handleSubmit = async function (caller) {
        console.log('handleSubmit', window, caller);
        try {
            const address = caller.form.elements.address.value;
            const phone = caller.form.elements.phone.value;
            const fileElement = document.getElementById('file') //caller.form.elements.file.baseURI;
            const file = fileElement && fileElement.files && fileElement.files[0]

            console.log('handleSubmit', 'address:', address, 'phone:', phone, 'file:', file);

            if (!address && !phone && !file) {
                throw new Error('Address, phone number, or file must be provided')
            }

            if ((address && phone) || (address && file) || (phone && file)) {
                return handleError(new Error('You can only enter in an address or a phone number or a file'))
            }

            if (file) {
                const reader = new FileReader();
                reader.onload = async function (e)  {
                    console.log('!!!!! onload', e);
                    let fileContents = e.target.result;
                    await processData(config.google.apiKey, address, phone, fileContents)
                };
                reader.readAsText(file);

            } else {
                await processData(config.google.apiKey, address, phone, null)
            }
        } catch (err) {
            handleError(err)
        }
    };

    window.onload = () => {
        try {
            console.log('onload');
            var button = document.getElementById('submit');
            button.addEventListener('click', function () {
                console.log('adding button event listener');
                handleSubmit(this);
            });


        } catch (err) {
            handleError(err);
        }
    };

    let scriptElement = document.createElement("script");
    //scriptElement.src = "https://maps.googleapis.com/maps/api/js?key=" + config.google.apiKey + "&libraries=places&callback=initMap";
    scriptElement.src = "https://maps.googleapis.com/maps/api/js?key=" + config.google.apiKey + "&libraries=places";
    scriptElement.defer = true;
    console.log('document', document);
    document.head.appendChild(scriptElement);

};

export {
    init,
}