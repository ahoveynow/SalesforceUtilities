# Async Throttler

A common use case (and the purpose for which it was originally conceived) is to prevent too many API calls from being fired at once. For example, if you are doing heavy processing, and you have to dispatch hundreds of API calls at once, you could overload both the browser and the servers you are calling. The Async Throttler artificially slows down the calls after they've been enqueued, and only allows a specified number of them to be dispatched at any given time (the default is 10). When one completes, the next enqueued method begins, and so on until all the queued async methods have run.

#See the [examples.js](lwc/asyncThrottler/examples.js) file for code samples.#

A note regarding timeouts: The timeout "races" against method completion, not method start. For this reason, an error will be thrown if the method does not complete before the timeout. However, if the method has already started when the timeout hits, it will continue to run, even though an error has already been thrown in response. This feature allows you to cap user wait times for long-running API calls.