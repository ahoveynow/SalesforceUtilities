import { LightningElement } from 'lwc';
import WebWorker from 'c/webWorker';
import SAMPLE_SCRIPTS_URL from '@salesforce/resourceUrl/sampleWebWorkerScripts';

export default class WebWorkerSamples extends LightningElement {

    connectedCallback() {
        setTimeout(() => {
            let codeUrl = SAMPLE_SCRIPTS_URL + '/generatePolygonsWithUrlImportedLib.js';
            WebWorker.createWebWorkerWithUrlJS('Worker 1', codeUrl, false, 'generate')
            .then((result) => {
                console.log('THE RESULT!!\n', result);
            });
        }, 5000);
    }
}