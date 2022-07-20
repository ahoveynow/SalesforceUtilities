/**
 * MIT License
 * Copyright (c) 2022 Andrew Hovey
 * Full License Text: https://ahovey.com/MITLicense.html
 * The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
 */

/**
 * THIS FILE PROVIDES SAMPLE CODE AND EXAMPLES OF THE SYNTAX TO USE THE ASYNC THROTTLER UTILITY.
 * 
 * A common use case (and the purpose for which it was originally conceived) is to prevent too many
 * API calls from being fired at once. For example, if you are doing heavy processing, and you have
 * to dispatch hundreds of API calls at once, you could overload both the browser and the servers
 * you are calling. The Async Throttler artificially slows down the calls after they've been enqueued,
 * and only allows a specified number of them to be dispatched at any given time (the default is 10).
 * When one completes, the next enqueued method begins, and so on until all the queued async methods have run.
 * 
 * The samples below show several variations of how the Async Throttler can be applied for different needs.
 * 
 * NOTE: The function parameter should always either be an async function,
 * or return an async function call (which resolves to a promise).
 * Otherwise, the methods will just run immediately rather than being processed through the queue.
 */


import { AsyncThrottler } from 'c/asyncThrottler';
import { sleep } from 'c/utilities';


// This method will be used by other examples to simulate an API Call
const simulateApiCall = async (anyParam) => {
    await sleep(5000); // similate call that takes 5 seconds round-trip
    console.log('Completed API Call: ' + anyParam);
    return anyParam;
};


/**
 * Enqueues a function with parameters.
 * Call must take place inside an anonymous function because you don't want the method to be called immediately.
 * Placing it in the anonymous function allows the Async Throttler to execute the method at the appropriate time.
 */
const enqueueWithParameters = async () => {
    let TEST_VALUE = 42;
    let result = await AsyncThrottler.enqueue(
        () => { return simulateApiCall(TEST_VALUE); }
    );
    
    console.log('Same value? ' + (result === TEST_VALUE));
}


/**
 * Enqueues a function without parameters.
 * Note how it can be passed in without being inside an anonymous function.
 */
const enqueueWithoutParameters = () => {
    AsyncThrottler.enqueue(simulateApiCall);
}


/**
 * Enqueues an anonymous function.
 */
const enqueueWithAnonymousFunction = async () => {
    let result = await AsyncThrottler.enqueue(
        async () => {
            await sleep(3000);
            let x = 5;
            return x + 30;
        }
    );

    console.log('Value should be 35: ' + result);
}


/**
 * Creates a custom throttler with 15 concurrent slots.
 * 100 API calls are requested at once.
 */
const customConcurrencyLimit = () => {

    const throttlerName = 'API Calls';
    const concurrencyLimit = 15;

    // Create the throttler with the custom concurrency limit
    AsyncThrottler.createThrottler(throttlerName, concurrencyLimit);

    // Simulate 100 API calls requested at once:
    for (let index = 0; index < 100; index++) {
        AsyncThrottler.enqueue(
            () => { return simulateApiCall(index); },
            throttlerName
        );
    }
}


/**
 * Enqueue methods with a timeout.
 * In this scenario, there are 11 methods that are enqueued.
 * If any of them wait longer than 7 seconds to complete, an error will be thrown for that method.
 * 
 * Since the first 10 take 5 seconds to run, the 11th must timeout because it will not complete until around 10 seconds.
 * Note that an error will be thrown, but the executing function will continue to run if it has already started.
 */
const enqueueWithTimeout = () => {

    for (let index = 0; index < 11; index++) {
        AsyncThrottler.enqueue(
            async () => {
                await sleep(5000); // wait 5 seconds
            },
            'My Throttler',
            7000 // timout after 7 seconds
        ).catch(err => {
            console.log('Index 10 should have failed: ' + index);
            console.log('Error Message: ', err);
        });
    }
}


/**
 * Enqueues 100 methods and stores the resulting promises in an array.
 * Awaits Promise.all to perform some action once all the calls have finished.
 */
const waitForAllToComplete = async () => {

    let apiPromises = [];
    // Simulate 100 API calls requested at once:
    for (let index = 0; index < 100; index++) {
        apiPromises.push(
            AsyncThrottler.enqueue(
                () => { return simulateApiCall(index); }
            )
        );
    }

    await Promise.all(apiPromises);
    console.log('All 100 simulated API calls have completed.');
}