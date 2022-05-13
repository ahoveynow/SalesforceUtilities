/**
 * MIT License
 * Copyright (c) 2022 Andrew Hovey
 * Full License Text: https://ahovey.com/MITLicense.html
 * The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
 * -----------------------------------------------------
 */
 
 ==============================
 USAGE:

1. Ensure that there is at least one instance of <c-web-worker> rendered on the page (only one is required).

2. In JS files where you wish to perform a JS task in a separate processing thread:

(a) Import the WebWorker class:

    import WebWorker from 'c/webWorker'; // Don't forget to import WebWorker


(b) Call the async method WebWorker.makeRequestToWebWorker()

    /** EXAMPLE WITH PARAMETERS **/

    try {
        let response = await WebWorker.makeRequestToWebWorker({
            code: this.sampleCodeWithParams,
            methodToCall: 'execute'; // optional
            methodParams: [4]; // optional
        });
        console.log('RESPONSE ', response);
    } catch (err) {
        console.error('ERROR making request ', err);
    }

    this.sampleCodeWithParams = `
        importScripts('https://unpkg.com/@turf/turf@6/turf.min.js');

        let factorial = (input) => {
            if (!Number.isInteger(input) || input < 1) {
                throw ('You must provide a positive integer. Your input: ' + input);
            }
            let product = input--;
            for (let current = input; current > 0; current--) {
                product *= current;
            }
            return product;
        }
        
        let execute = (num) => {
            let result = factorial(num);
            postMessage(result);
        }
    `;



    /** EXAMPLE WITHOUT PARAMETERS **/

    try {
        let response = await WebWorker.makeRequestToWebWorker({
            code: this.sampleCodeWithoutParams
        });
        console.log('RESPONSE ', response);
    } catch (err) {
        console.error('ERROR making request ', err);
    }

    this.sampleCodeWithoutParams = `
        let factorial = (input) => {
            if (!Number.isInteger(input) || input < 1) {
                throw ('You must provide a positive integer. Your input: ' + input);
            }
            let product = input--;
            for (let current = input; current > 0; current--) {
                product *= current;
            }
            return product;
        }

        let num = 5;
        let result = factorial(num);
        postMessage(result);
    `;

    

NOTES:
 - In your code, return a value returnValue by calling "postMessage(returnValue)"
 - In your code, you can allow errors to be thrown, and catch them outside of WebWorker.makeRequestToWebWorker
 - WebWorker.makeRequestToWebWorker is async, so you can await it or use it as a promise.
 - You can import 3rd party scripts using the importScripts method. If you want to use a static resource, use it's absolute or relative URL (untested).