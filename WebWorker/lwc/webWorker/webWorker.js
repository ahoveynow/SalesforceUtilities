/**
 * MIT License
 * Copyright (c) 2022 Andrew Hovey
 * Full License Text: https://ahovey.com/MITLicense.html
 * The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
 * -----------------------------------------------------
 * NOTICE: THIS IS A WORK IN PROGRESS
 */

import { LightningElement } from 'lwc';

export default class WebWorker extends LightningElement {

    static instance;
    visualforcePageUrl = '/apex/WebWorker';
    iframeElement;
    requestResolvers = {};

    connectedCallback() {
        window.addEventListener('message', this.handleResponseFromVFP);
        if (!WebWorker.instance) {
            WebWorker.instance = this;
        }
    }

    renderedCallback() {
        this.iframeElement = this.template.querySelector('[data-id=iframeDiv');
    }



    /**
     * 
     * @public
     * @param {*} data 
     * @returns 
     */
     static makeRequestToWebWorker = async (data) => {
        if (!WebWorker.instance) {
            throw 'No instance of the WebWorker component has been loaded.';
        }

        if (!data.workerId) {
            data.workerId = Date.now();
        }
        let workerId = data.workerId;

        // Initiate worker
        this.instance.iframeElement.contentWindow.postMessage(data, '*');

        // Store resolve and reject so that we can call one when we receive a message from the VFP later on
        this.instance.requestResolvers[workerId] = {};
        let resolution = new Promise((resolve, reject) => {
            this.instance.requestResolvers[workerId].resolve = resolve;
            this.instance.requestResolvers[workerId].reject = reject;
        });

        return await resolution;
    }



    handleResponseFromVFP = async (webWorkerMessageEvent) => {
        let response = { ...webWorkerMessageEvent.data };

        // Resolve Proxies
        if (Array.isArray(response.detail)) {
            response.detail = [...webWorkerMessageEvent.data.detail];
        }
        if (typeof (response.detail) === 'object') {
            response.detail = {...webWorkerMessageEvent.data.detail};
        }
        
        if (response.success === true) {
            this.requestResolvers[response.workerId].resolve(response.detail);
        } else {
            this.requestResolvers[response.workerId].reject(response.detail);
        }
    };

}