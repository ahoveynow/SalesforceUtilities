/**
 * MIT License
 * Copyright (c) 2022 Andrew Hovey
 * Full License Text: https://ahovey.com/MITLicense.html
 * The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
 */

import { Throttler, DEFAULT_CONCURRENT_LIMIT } from './helper';

export default class AsyncThrottler {

    static throttlers = {};


    /**
     * Create a named throttler with a custom concurrent running limit.
     * 
     * @param {String} throttlerName 
     * @param {Integer} concurrentRunningLimit - The number of async methods that can be executing at one time
     * 
     * @public
     */
    static createThrottler = (throttlerName, concurrentRunningLimit = DEFAULT_CONCURRENT_LIMIT) => {
        let throttler = new Throttler(throttlerName, concurrentRunningLimit);
        AsyncThrottler.throttlers[throttlerName] = throttler;
    }


    /**
     * Enqueue an async function. It will run when a slot opens up in the specified throttler.
     * 
     * @example
     *      let result = await AsyncThrottler.enqueue(
     *          () => { return this.someAsyncMethod(); },
     *          'API Calls',
     *          60000 // timeout after 1 minute
     *      );
     * 
     * @param {Function} functionToCall 
     * @param {String} throttlerName 
     * @param {Integer} [timeout] Timeout in milliseconds. Leave blank for no timeout.
     * 
     * @returns {Promise} The result of functionToCall (or error)
     * @public
     */
    static enqueue = async (functionToCall, throttlerName = '', timeout) => {
        let throttler = AsyncThrottler.throttlers[throttlerName];
        if (!throttler) {
            AsyncThrottler.createThrottler(throttlerName);
            throttler = AsyncThrottler.throttlers[throttlerName];
        }
        return await throttler.enqueue(functionToCall, timeout);
    }

}