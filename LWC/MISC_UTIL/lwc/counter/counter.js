/**
* A counter to create incrementing IDs within a page load.
*/
export class Counter {

    /**
     * A map of counters.
     * @type {Object.<String, Counter>}
     * @static
     */
    static counters = {};

    /**
     * The current count value, that increments after each request.
     * @private
     */
    current = 1;

    /**
     * The ID of the counter
     * @type {String}
     */
    id;




    constructor(counterId) {
        this.id = counterId;
        Counter.counters[counterId] = this;
    }




    /**
     * Gets a counter string using a provided prefix.
     * Increments current each time the method is run.
     * @param {String} prefix
     * @param {String} [counterId]- OPTIONAL: The counter ID for the specific counter to increment.
     * @returns {String}
     * @public
     * @static
     * @example
     *  const id = Counter.getNextCountString('TEST_'); // 'TEST_32'
     *  const id_new = Counter.getNextCountString('TEST_', 'specialCounter'); // 'TEST_1'
     */
    static getNextCountString = (prefix = '', counterId) => {
        let requestedCounter = Counter.counters[counterId];
        if (!requestedCounter) {
            requestedCounter = new Counter(counterId);
        }
        return `${prefix}${requestedCounter.current++}`;
    }


    /**
     * Gets an integer from the specified counter. Increments current each time the method is run.
     * @param {String} [counterId]- OPTIONAL: The counter ID for the specific counter to increment.
     * @returns {Integer}
     * @public
     * @static
     */
    static getNextCount = (counterId) => {
        let requestedCounter = Counter.counters[counterId];
        if (!requestedCounter) {
            requestedCounter = new Counter(counterId);
        }
        return requestedCounter.current++;
    }
}
