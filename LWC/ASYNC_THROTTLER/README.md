# Async Throttler

A common use case (and the purpose for which it was originally conceived) is to prevent too many API calls from being fired at once. For example, if you are doing heavy processing, and you have to dispatch hundreds of API calls at once, you could overload both the browser and the servers you are calling. The Async Throttler artificially slows down the calls after they've been enqueued, and only allows a specified number of them to be dispatched at any given time (the default is 10). When one completes, the next enqueued method begins, and so on until all the queued async methods have run.

See the examples.js file for code samples.