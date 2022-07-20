/**
 * MIT License
 * Copyright (c) 2022 Andrew Hovey
 * Full License Text: https://ahovey.com/MITLicense.html
 * The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
 */

import { sleep } from 'c/utilities';

export const DEFAULT_CONCURRENT_LIMIT = 10;

const TIMED_OUT_MESSAGE = 'Request timed out';



export class EnqueuedFunction {

    uniqueId;
    functionToExecute;
    resolveFunction;
    rejectFunction;


    constructor (uniqueId, functionToExecute, resolveFunction, rejectFunction) {
        this.uniqueId = uniqueId;
        this.functionToExecute = functionToExecute;
        this.resolveFunction = resolveFunction;
        this.rejectFunction = rejectFunction;
    }


    execute = async () => {
        try {
            let result = await this.functionToExecute();
            this.resolveFunction(result);
        } catch (err) {
            this.rejectFunction(err);
        }
    }
}




export class Throttler {

    currentlyRunning = 0;
    concurrentRunningLimit;
    queue = [];
    queueMap = {};
    throttlerName;


    constructor (throttlerName, concurrentRunningLimit) {
        this.throttlerName = throttlerName;
        this.concurrentRunningLimit = concurrentRunningLimit;
    }


    dequeueNextIfPossible = async () => {

        if (this.currentlyRunning >= this.concurrentRunningLimit) { return; } // Don't do anything if we're already at capacity
        if (this.queue.length === 0) { return; } // If the queue is empty we're all done.

        // Execute Next
        let next = this.queue.shift();
        let uniqueId = next.uniqueId;
        this.currentlyRunning++;
        await next.execute();

        // Post-execute
        this.currentlyRunning--;
        delete this.queueMap[uniqueId];
        this.dequeueNextIfPossible();
    }


    /**
     * 
     * @param {Function} functionToCall 
     * @param {Integer} timeout 
     * 
     * @returns {Promise} The result of functionToCall (or error)
     */
    enqueue = async (functionToCall, timeout) => {

        let functionUniqueId = this.generateUniqueId();

        // Store resolve and reject so that we can call one when appropriate
        let resolution = new Promise((resolve, reject) => {
            let enqueuedFunctionInstance = new EnqueuedFunction(functionUniqueId, functionToCall, resolve, reject, this.throttlerName);
            this.queue.push(enqueuedFunctionInstance);
            this.queueMap[functionUniqueId] = enqueuedFunctionInstance;
        });

        // Manage timeout
        if (timeout && typeof timeout === 'number') {
            let timeoutPromise = sleep(timeout).then(() => { return TIMED_OUT_MESSAGE; });
            this.dequeueNextIfPossible(); // async
            let response = await Promise.race([resolution, timeoutPromise]);
            if (response === TIMED_OUT_MESSAGE) {
                this.timeout(functionUniqueId);
                throw TIMED_OUT_MESSAGE;
            } else {
                return response;
            }
        } else {
            this.dequeueNextIfPossible(); // async
            return await resolution; // return if no timeout is set
        }
    }


    generateUniqueId = () => {
        return `${Date.now()}_${Math.random()}`;
    }


    timeout = (functionUniqueId) => {
        delete this.queueMap[functionUniqueId];
        this.queue = this.queue.filter(enqueuedFunction => enqueuedFunction.uniqueId !== functionUniqueId);
    }

}