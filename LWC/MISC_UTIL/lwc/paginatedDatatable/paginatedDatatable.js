/**
 * MIT License
 * Copyright (c) 2022 Andrew Hovey
 * Full License Text: https://ahovey.com/MITLicense.html
 * The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
 */

import { LightningElement, api, track } from 'lwc';
import { 
    sleep
} from 'c/utilities';


/**
 * Determines if a value is an integer. Strings are not be parsed.
 * @param {*} value The value which will be determined as an integer or not.
 * @returns {Boolean} True if value is an integer, false otherwise.
 */
const isInteger = (value) => {
    return !Number.isNaN(value) && Number.isInteger(value);
}


export default class PaginatedDatatable extends LightningElement {

    /****************************/
    /***** CLASS PROPERTIES *****/
    /****************************/

    /* Important note about the order of properties when using <c-paginated-datatable>:
     * Because of the use of getters and their dependencies, you will experience the best performance
     * when you assign these properties in this order in your markup:
     *  - hide-internal-searchbar (search term will not be assigned from parent unless internal searchbar is hidden)
     *  - search-term (list-data will render in it's entirety before attempting filter if search-term is not first)
     *  - list-data
     */


    /* API PROPERTIES */
    
    @api keyField;
    @api columns = [];
    @api searchFilterFields = []; // list of field names to search with the text filter
    @api hideInternalSearchbar = false; // IMPORTANT: This attribute must be assigned BEFORE search-term since the searchTerm setter depends on it
    @api pageSizeOptions = [20, 50, 100];

    /* API PROPERTIES WITH SETTERS */

    @api set listData(value = []) { this.setListData(value); }
    get listData() { return this._listData; }
    _listData = [];

    @api set searchTerm(value = '') { this.setSearchTermFromParent(value); }
    get searchTerm() { return this._searchTermInternal; }

    @api set maxHeight(value) { this.setMaxHeightFromParent(value); }
    get maxHeight() { return this._maxHeight; }
    _maxHeight;

    /* PRIVATE PROPERTIES */

    filteredData = [];
    datatableWrapperStyle = '';

    @track pagination = {
        currentPageIndex: 0,
        pageSize: 20,
    };


    connectedCallback() {
        this.setDefaultPageSize();
    }

    
    /************************************/
    /***** PROPERTY GETTERS/SETTERS *****/
    /************************************/


    setMaxHeightFromParent = async (value) => {
        this._maxHeight = value;
        this.updateDatatableWrapperStyle();
    }

    /*** SEARCH TERM ***/
    set searchTermInternal(value = '') {
        // Set asynchronously to free up event queue
        setTimeout(async () => {
            if (value !== this._searchTermInternal) {
                this._searchTermInternal = value;
                this.filterData(); // async
            }
        }, 0);
    }
    get searchTermInternal() { return this._searchTermInternal; }
    _searchTermInternal = '';


    setSearchTermFromParent = async (value = '') => {
        // If internal searchbar is used, parent cannot overwrite
        if (!this.hideInternalSearchbar) { return; }
        this.searchTermInternal = value;
        this.updateDatatableWrapperStyle();
    };


    /*** LIST DATA ***/
    setListData = (value = '') => {
        // Set asynchronously to free up event queue
        setTimeout(async () => {
            this._listData = value;
            this.filterData(); // async
        }, 0);
    };


    get pagination_reactive() {

        // Pages
        let pages = [];
        for (let pageIndex = 0; pageIndex * this.pagination.pageSize < this.filteredData.length; pageIndex++) {
            pages.push({
                index: pageIndex,
                pageNumber: pageIndex + 1,
                isSelected: pageIndex === this.pagination.currentPageIndex,
            });
        }
        
        // Paginated Data
        let startIndex = this.pagination.currentPageIndex * this.pagination.pageSize;
        let paginatedData = this.filteredData.slice(startIndex, startIndex + this.pagination.pageSize);

        // Record Count String
        let startNumber = startIndex + 1;
        let endNumber = startIndex + paginatedData.length;
        let recordCountString = `${startNumber}-${endNumber} of ${this.filteredData.length}`;

        // Page Size Selector
        let pageSizesSet = new Set(this.pageSizeOptions.filter(num => isInteger(num)) || []);
        let pageSizes = [];
        if (pageSizesSet.size === 0) {
            pageSizes = [20];
        } else {
            pageSizes = Array.from(pageSizesSet);
            pageSizes.sort((a,b) => a - b);
            pageSizes = pageSizes.slice(0,3); // only 3 options are supported
        }
        let pageSizeOptions = pageSizes.map(pageSize => {
            return {
                value: pageSize,
                variant: (pageSize === this.pagination.pageSize ? 'brand' : 'neutral'),
            }
        });

        return {
            pages: pages,
            paginatedData: paginatedData,
            recordCountString: recordCountString,
            pageSizeOptions: pageSizeOptions,
        };
    }


    get showNoResultsFound() {
        return this.searchTermInternal && this.filteredData.length === 0;
    }




    /***************************/
    /***** HANDLER METHODS *****/
    /***************************/

    /**
     * Handles custom row actions from the lightning-datatable in this component,
     * and passes the payload on to the parent unaltered.
     * 
     * @param {Event} event
     * @fires ListView#rowaction
     * @listens event:Lightning.Datatable#rowaction
     */
    handleDatatableRowAction = async (event) => {
        this.dispatchEvent(new CustomEvent('rowaction', {detail: event.detail}));
    }


    handlePageChange = async (event) => {
        let newPage = Number(event.target.dataset.pageIndex);
        
        if (!isInteger(newPage)
            || newPage < 0 
            || newPage >= this.pagination_reactive.pages.length)
        {
            return;
        }
        
        this.pagination.currentPageIndex = newPage;
        this.updateDatatableWrapperStyle();
    }


    handlePageSizeSelection = async (event) => {
        const label = event.target.label;
        this.pagination.pageSize = parseInt(label);
        this.pagination.currentPageIndex = 0;
        this.updateDatatableWrapperStyle();
    }



    /***************************/
    /***** PRIVATE METHODS *****/
    /***************************/

    /**
     * Filters the list data using a search term and a list of fields to compare against.
     * @private
     */
    filterData = async () => {
        if (!this.searchTermInternal) {
            this.filteredData = [...this.listData];
            return;
        }

        let filteredData = [];
        const searchTermLowerCase = this.searchTermInternal.toLowerCase();
        for (let lineItem of this.listData) {
            for (let fieldName of this.searchFilterFields || []) {
                if ((`${lineItem[fieldName] || ''}`).toLowerCase().includes(searchTermLowerCase)) {
                    filteredData.push(lineItem);
                    break;
                }
            }
        }

        this.filteredData = filteredData;
        this.pagination.currentPageIndex = 0;
    }


    setDefaultPageSize = () => {
        this.pagination.pageSize = this.pagination_reactive.pageSizeOptions[0].value;
    }


    updateDatatableWrapperStyle = async () => {
        await sleep();
        let styles = [];

        if (this.maxHeight) {
            let headerUtilsElement = this.template.querySelector('div.header-utilities');
            let offsetHeight = headerUtilsElement?.offsetHeight || 0;
            let paginationElement = this.template.querySelector('div.pagination-wrapper');
            let spaceForPagination = 5 + (paginationElement?.offsetHeight || 0);
            styles.push(`margin-bottom: ${spaceForPagination}px`);
            let calculatedHeight = this.maxHeight - offsetHeight - spaceForPagination;
            styles.push(`height: ${calculatedHeight}px`);
        }
        this.datatableWrapperStyle = styles.join(';');
    }
}