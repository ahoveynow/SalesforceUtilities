/**
 * MIT License
 * Copyright (c) 2022 Andrew Hovey
 * Full License Text: https://ahovey.com/MITLicense.html
 * The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
 * -----------------------------------------------------
 * Note: Some of these utility methods on their own are generic enough that they may not
 * justify copyright. Use good judgement if you choose to use it without the copyright notice.
 */

/**
 * Converts a rem value to a pixel value.
 * @param {Number} rem The rem ("root em") value to be converted.
 * @returns {Number} The number of pixels after conversion.
 */
export const convertRemToPixels = (rem) => {    
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

/**
 * "Sleeps" for a specified number of milliseconds and resolves.
 * If you await a call to this method, you can cause a method to pause for various purposes.
 * Passing in 0 (or allowing default) will simply make the remainder of your method (if you await)
 * enter the end of the JS event queue, which is helpful for UX and LWC reactive needs.
 * 
 * @param {Integer} [msToSleep] The number of milliseconds to sleep
 * @returns Promise which resolves when msToSleep completes.
 * 
 * @example <caption>Wait 1 second before proceeding.</caption>
 * await sleep(1000);
 * @example <caption>Shift to the end of the Javascript event queue.</caption>
 * await sleep();
 */

export const sleep = (msToSleep = 0) => new Promise((resolve) => setTimeout(resolve, msToSleep));
