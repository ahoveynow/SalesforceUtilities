/**
 * MIT License
 * Copyright (c) 2022 Andrew Hovey
 * Full License Text: https://ahovey.com/MITLicense.html
 * The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
 * -----------------------------------------------------
 * NOTICE: THIS IS A WORK IN PROGRESS
 */

/**
 * REMAINING TO-DO ITEMS:
 * - Figure out security for second parameter of postMessage
 * - Determine if adding multiple instances of <c-web-worker> will try to handle responses multiple times
 * - Solve situation where if the singleton instance is destroyed, another instance can take its place (for new workers... any on the destroyed instance will gone)
 * - Add JSDoc comments
 * - Complete usage documentation (README)
 */

 import { LightningElement } from 'lwc';

 const LWC_MESSAGE_REF = 'LWC_WEB_WORKER';
 const TIMED_OUT_MESSAGE = 'Request timed out';
 const VISUALFORCE_PAGE_NAME = 'WebWorker';
 
 const ACTIONS = {
     CREATE_DYNAMIC: 'CREATE_DYNAMIC',
     CREATE_URL: 'CREATE_URL',
     GET_IS_ACTIVE: 'GET_IS_ACTIVE',
     RUN_METHOD: 'RUN_METHOD',
     TERMINATE: 'TERMINATE',
 };
 
 const sleep = (msToSleep = 0) => new Promise((resolve) => setTimeout(resolve, msToSleep));
 
 const WorkerWrapper = class {
 
     workerId;
     requests = {};
 
     constructor(workerId) {
         this.workerId = workerId;
     }
 
 
     /**
      * 
      * @param {String} requestId 
      * @param {function} resolveFunction 
      * @param {function} rejectFunction 
      */
     addRequest = (requestId, resolveFunction, rejectFunction) => {
         this.requests[requestId] = new WorkerRequest(requestId, resolveFunction, rejectFunction);
     }
 
 
     /**
      * 
      * @param {Object} data 
      * @returns {Promise<Object | undefined | Error>}
      * @private
      */
     makeRequest = async (data, timeoutInSeconds) => {
         WebWorker.verifications.verifyComponentLoaded();
 
         // Generate requestId
         let requestId = `${this.workerId}_${Date.now()}`;
         data.requestId = requestId;
 
         // messageRef is checked both in this component and the Visualforce page so that unrelated page messages are ignored
         data.messageRef = LWC_MESSAGE_REF;
 
         // Send request to worker
         WebWorker.singleton.iframeElement.contentWindow.postMessage(data, '*');
 
         // Store resolve and reject so that we can call one when we receive a message from the VFP later on
         let resolution = new Promise((resolve, reject) => {
             this.addRequest(requestId, resolve, reject);
         });
 
         // Manage timeout
         if (timeoutInSeconds && typeof timeoutInSeconds === 'number') {
             let timeoutPromise = sleep(timeoutInSeconds * 1000).then(() => { return TIMED_OUT_MESSAGE; });
             let response = await Promise.race([resolution, timeoutPromise]);
             if (response === TIMED_OUT_MESSAGE) {
                 this.cancelRequest(requestId);
                 throw TIMED_OUT_MESSAGE;
             } else {
                 return response;
             }
         } else {
             return await resolution; // return if no timeout is set
         }
     }
 
 
     /**
      * 
      * @param {*} requestId 
      */
     cancelRequest = (requestId) => {
         delete this.requests[requestId];
     }
 };
 
 
 const WorkerRequest = class {
     requestId;
     resolveFunction;
     rejectFunction;
 
     constructor(requestId, resolveFunction, rejectFunction) {
         this.requestId = requestId;
         this.resolveFunction = resolveFunction;
         this.rejectFunction = rejectFunction;
     }
 
     resolve = (returnValue) => {
         if (this.resolveFunction) {
             this.resolveFunction(returnValue);
         }
     }
 
     reject = (errorDetail) => {
         if (this.rejectFunction) {
             this.rejectFunction(errorDetail);
         }
     }
 }
 
 
 export default class WebWorker extends LightningElement {
 
     static singleton;
     static workers = {}; // Values are instances of WorkerWrapper
 
     visualforcePageUrl = `/apex/${VISUALFORCE_PAGE_NAME}`;
     iframeElement;
     isActive = false; // Need to improve
 
     connectedCallback() {
         // TO-DO: NEED TO CHECK IF THIS LINE BELOW IS GOING TO CAUSE DUPLICATE HANDLING IF COMPONENT IS ADDED IN MULTIPLE PLACES:
         window.addEventListener('message', this.handleResponseFromVFP);
         if (!WebWorker.singleton) {
             WebWorker.singleton = this;
             this.isActive = true;
         } else {
 
         }
     }
 
 
     renderedCallback() {
         this.iframeElement = this.template.querySelector('[data-id=iframeDiv');
     }
 
 
     /**
      * 
      * 
      * @param {String} workerId 
      * @param {String} jsCode 
      * @param {Boolean} keepAlive 
      * @param {String | undefined} [methodToCall] 
      * @param {Object[] | undefined} [methodParams] 
      * @param {Integer | undefined} [timeoutInSeconds] 
      * @returns {Promise<Object | undefined | Error}
      * 
      * @public
      */
     static createWebWorkerWithDynamicJS = async (workerId, jsCode, keepAlive = false, methodToCall = '', methodParams = [], timeoutInSeconds) => {
         WebWorker.verifications.verifyComponentLoaded();
 
         // Set workerId if empty
         if (!workerId) {
             workerId = Date.now();
             WebWorker.verifications.verifyKeepAliveFalse(keepAlive);
         }
 
         // If Worker exists with same workerId, call reject on them, as the worker will be terminated.
         let existingWorkerWrapperWithSameId = WebWorker.workers[workerId];
         if (existingWorkerWrapperWithSameId) {
             for (let request of Object.values(existingWorkerWrapperWithSameId.requests)) {
                 request.reject(`This worker was terminated because it was replaced by another worker with the same workerId (${workerId}). Please use caution when reusing worker IDs.`);
             }
         }
 
         let workerWrapper = new WorkerWrapper(workerId);
         WebWorker.workers[workerId] = workerWrapper;
 
         let dataPayload = {
             workerId: workerId,
             action: ACTIONS.CREATE_DYNAMIC,
             code: jsCode,
             keepAlive: keepAlive,
             methodToCall: methodToCall,
             methodParams: methodParams,
         };
 
         return workerWrapper.makeRequest(dataPayload, timeoutInSeconds);
     };
 
 
     /**
      * 
      * 
      * @param {String} workerId 
      * @param {String} codeUrl 
      * @param {Boolean} keepAlive 
      * @param {String | undefined} [methodToCall]
      * @param {Object[] | undefined} [methodParams]
      * @param {Integer | undefined} [timeoutInSeconds]
      * @returns {Promise<Object | undefined | Error}
      * 
      * @public
      */
     static createWebWorkerWithUrlJS = async (workerId, codeUrl, keepAlive = false, methodToCall = '', methodParams = [], timeoutInSeconds) => {
         WebWorker.verifications.verifyComponentLoaded();
 
         // Set workerId if empty
         if (!workerId) {
             workerId = Date.now();
             WebWorker.verifications.verifyKeepAliveFalse(keepAlive);
         }
 
         let workerWrapper = new WorkerWrapper(workerId);
         WebWorker.workers[workerId] = workerWrapper;
 
         let dataPayload = {
             workerId: workerId,
             action: ACTIONS.CREATE_URL,
             codeUrl: codeUrl,
             keepAlive: keepAlive,
             methodToCall: methodToCall,
             methodParams: methodParams,
         };
 
         return workerWrapper.makeRequest(dataPayload, timeoutInSeconds);
     };
 
 
     /**
      * 
      * 
      * @param {String} workerId 
      * @param {Integer | undefined} [timeoutInSeconds] 
      * @returns {Promise<Boolean | Error>}
      * 
      * @public
      */
     static getWorkerIsAlive = async (workerId, timeoutInSeconds) => {
         WebWorker.verifications.verifyComponentLoaded();
         WebWorker.verifications.verifyWorkerIdSpecified(workerId);
 
         let workerWrapper = WebWorker.workers[workerId];
         if (!workerWrapper) {
             return false; // if worker does not exist it is not active
         }
 
         let dataPayload = {
             workerId: workerId,
             action: ACTIONS.GET_IS_ACTIVE,
         };
 
         return workerWrapper.makeRequest(dataPayload, timeoutInSeconds);
     }
 
     
     /**
      * 
      * 
      * @param {String} workerId 
      * @param {String} methodToCall 
      * @param {Object[]} [methodParams] 
      * @param {Integer | undefined} [timeoutInSeconds] 
      * @returns {Promise<Object | undefined | Error}
      * 
      * @apublic
      */
     static runMethodOnWebWorker = async (workerId, methodToCall = '', methodParams = [], timeoutInSeconds) => {
         WebWorker.verifications.verifyComponentLoaded();
         WebWorker.verifications.verifyWorkerIdSpecified(workerId);
 
         let workerWrapper = WebWorker.workers[workerId];
         if (!workerWrapper) {
             throw `There is no worker with workerId ${workerId}.`;
         }
 
         if (await WebWorker.getWorkerIsAlive(workerId) == false) {
             throw `Worker with workerId ${workerId} has been terminated or was never active.`;
         }
 
         let dataPayload = {
             workerId: workerId,
             action: ACTIONS.RUN_METHOD,
             methodToCall: methodToCall,
             methodParams: methodParams,
         }
 
         return workerWrapper.makeRequest(dataPayload, timeoutInSeconds);
     }
 
 
     /**
      * 
      * @param {String} workerId 
      * @param {Integer | undefined} [timeoutInSeconds] 
      * @returns {Promise<undefined | Error}
      * 
      * @public
      */
     static terminateWebWorker = async (workerId, timeoutInSeconds) => {
         WebWorker.verifications.verifyComponentLoaded();
         WebWorker.verifications.verifyWorkerIdSpecified(workerId);
 
         let workerWrapper = WebWorker.workers[workerId];
         if (!workerWrapper) {
             return; // if worker does not exist, no action required
         }
 
         let dataPayload = {
             workerId: workerId,
             action: ACTIONS.TERMINATE,
         };
 
         workerWrapper.makeRequest(dataPayload, timeoutInSeconds);
     }
 
 
     /**
      * 
      * @param {Object} webWorkerMessageEvent 
      * @returns 
      * 
      * @private
      */
     handleResponseFromVFP = async (webWorkerMessageEvent) => {
         if (webWorkerMessageEvent?.data?.messageRef !== LWC_MESSAGE_REF) { return; } // Ignore anything not from the WebWorker Visualforce Page
         let response = { ...webWorkerMessageEvent.data };
 
         // Resolve Proxies
         if (Array.isArray(response.detail)) {
             response.detail = [...webWorkerMessageEvent.data.detail];
         }
         if (typeof (response.detail) === 'object') {
             response.detail = {...webWorkerMessageEvent.data.detail};
         }
 
         if (response.success === true) {
             WebWorker.workers[response.workerId].requests[response.requestId]?.resolve(response.detail);
         } else {
             WebWorker.workers[response.workerId].requests[response.requestId]?.reject(response.detail);
         }
     };
 
 
     /**
      * 
      * @private
      */
     static verifications = {
         verifyComponentLoaded: () => {
             if (!WebWorker.singleton) {
                 throw 'No instance of the WebWorker component has been loaded.';
             }
         },
 
         verifyWorkerIdSpecified: (workerId) => {
             if (!workerId) {
                 throw 'workerId must be specified.';
             }
         },
 
         verifyKeepAliveFalse: (keepAlive) => {
             if (keepAlive) {
                 throw 'If you do not specify a workerId, keepAlive must be set to false, as you will have no way to access the worker again.';
             }
         }
     }
 }