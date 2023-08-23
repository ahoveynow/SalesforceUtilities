import { LightningElement, api, track } from 'lwc';

//delay used to debounce event handlers
const delay = 500;

export default class Combobox extends LightningElement {

    @api label = '';
    @api placeholder = 'Search...';
    @api required = false;
    @api disabled = false;
    @api fieldLevelHelp = undefined;
    @api broadcastSelection = false;
    
    @api
    set value(val) { this._value = val; }
    get value() { return this._value; }
    _value = '';

    @api sortCategoriesAlphabetically = false;
    @api sortLabelsAlphabetically = false;

    /* List of items sent in by parent component.
     * Example option: {
            label: 'My Label',
            value: 'value1',
            subtext: 'Relevant to My Label', // will appear under the label
            backupIcon: 'utility:trash',
            category: 'Category 1' // used to group options
     * }
     */
    @api 
    set options(val) {
        // Disconnect from passed-in value that may be observed in ancestor
        // If this is removed, there will be significant performance degredation in certain scenarios!
        this._options = [...(val.filter(item => item.value) || [])]; // filter out null value
    }
    get options() { return this._options; }
    _options = [];
    
    /* Not using LWC reactivity for this because of performance degradation with longer sets of values */
    set isExpanded(val) {
        if (val === false) {
            this.template.querySelector('.results-box').classList.add('slds-hide');
        } else {
            this.template.querySelector('.results-box').classList.remove('slds-hide');
        }
    }
    get isExpanded() { return this._isExpanded; }
    _isExpanded = false;

    get selection() {
        return this.options.find( option => option.value === this.value );
    }

    get optionsToDisplay() {
        let listContentsByCategory = {};
        let markedHeaders = {};

        for (let item of this.options) {
            if (typeof item !== 'object' || item === null) { continue; } // continue if item is not an object or if item is null

            const searchLC = (this.search.searchTerm || '').toLowerCase();
            const categoryLC = (item.category || '').toLowerCase();
            const labelLC = (item.label || '').toLowerCase();
            const subtextLC = (item.subtext || '').toLowerCase();

            //check if lowercase search terms are inside of category, label, or subtext if search term exists
            if (searchLC
                && categoryLC.includes(searchLC) === false
                && labelLC.includes(searchLC) === false
                && subtextLC.includes(searchLC) === false
            ) { continue; }

            // if listContentsByCategory[category] does not exist, replace with empty array
            listContentsByCategory[categoryLC] = (listContentsByCategory[categoryLC] || []);
            if (markedHeaders[categoryLC] === undefined) {                
                markedHeaders[categoryLC] = this.generateMarkedText(categoryLC, searchLC);
            }

            listContentsByCategory[categoryLC].push({
                ...item,
                markedLabel: searchLC ? this.generateMarkedText(item.label, searchLC) : item.label,
                markedSubtext: (item.subtext && searchLC) ? this.generateMarkedText(item.subtext, searchLC) : item.subtext,
            });
        }
        
        let listContents = [];

        for (const [header, listObjects] of Object.entries(listContentsByCategory)) {
                //put blank headers at front of list for ease of readability
                if (header === '') {
                      listContents.unshift( {header, markedHeader: '', listObjects} );
                }
                //put all other headers at end of list
                else {
                      listContents.push( {header, markedHeader: markedHeaders[header.toLowerCase()], listObjects} );
                }
        }

        //optionally sort if listContents.length > 0
        //before returning listcontents or empty array
        if (listContents.length > 0) {
            //sorts categories alphabetically
            if (this.sortCategoriesAlphabetically) {
                    listContents.sort((a, b) => (a.header.toLowerCase() > b.header.toLowerCase()) ? 1: -1);
            }

            //sorts labels within category alphabetically
            if (this.sortLabelsAlphabetically) {
                    for (let category of listContents) {
                        category.listObjects.sort((a, b) => (a.label.toLowerCase()  > b.label.toLowerCase()) ? 1: -1);
                    }
            }
            return {results: listContents, size: listContents.length};
        } else {
            return {results: [], size: 0};
        }
    }

    generateMarkedText(unmarkedText, searchText) {
        let markedText = unmarkedText || '';
        const substrIndex = (unmarkedText || '').toLowerCase().indexOf(searchText);
        if (substrIndex !== -1) {
            markedText = markedText.slice(0, substrIndex)
                            + `<mark>${markedText.slice(substrIndex, substrIndex + searchText.length)}</mark>`
                            + markedText.slice(substrIndex + searchText.length);
        }
        return markedText;
    }

    get showLabel() {
        return this.label || this.required || this.fieldLevelHelp;
    }

    connectedCallback() { }

    renderedCallback() { }

    //processes selection of object
    handleSelection(event) {
        this.value = event.currentTarget.dataset.value;
        this.search.searchTerm = this.search.searchTermRender = '';
        this.isExpanded = false;
        const selection = this.broadcastSelection === true ? this.selection : null;

        this.dispatchEvent(new CustomEvent('change', { detail: { 
            value: this.value,
            selection: selection
        }}));
    }

    //removes selection on press of button
    handleRemoveSelection(event) {
        this.value = '';
        this.dispatchEvent(new CustomEvent('clear', {detail: {value: ''}}));
        this.dispatchEvent(new CustomEvent('change', {detail: {value: '', selection: null}}));
    }

    focusManager = {
        textFieldHasFocus: false,
        dropdownHasFocus: false,

        handleDropdownFocusIn: () => {
            this.focusManager.dropdownHasFocus = true;
            this.focusManager.handleFocusChange();
        },

        handleDropdownFocusOut: () => {
            this.focusManager.dropdownHasFocus = false;
            this.focusManager.handleFocusChange();
        },

        handleTextboxFocusIn: () => {
            this.focusManager.textFieldHasFocus = true;
            this.focusManager.handleFocusChange();
        },

        handleTextboxFocusOut: () => {
            this.focusManager.textFieldHasFocus = false;
            this.focusManager.handleFocusChange();
        },

        handleFocusChange: () => {
            setTimeout(() => {
                // Only closes dropdown if neither the text field nor the dropdown div has focus
                if (this.focusManager.textFieldHasFocus === false && this.focusManager.dropdownHasFocus === false) {
                    this.focusManager.handleCloseDropdown();
                }
            }, 50); // there's a brief moment where neither has focus during a transition between the two -- this accounts for that
        },

        handleCloseDropdown: () => {
            //delay closing dropdown by 100ms to prevent dropdown from closing when a value is selected
            //prevents onfocusout from firing too soon
            setTimeout(() => { this.isExpanded = false; }, 100);
        },
    }

    handleOpenDropdown() {
        this.isExpanded = true;
    } 

    @track search = {
        searchTerm: '',
        searchTermRender: '',
        processing: false,
        timeoutId: undefined, // for input debounce
        handleKeyPress: (event) => {
            //get search input
            const searchTerm = event.target.value;

            clearTimeout(this.search.timeoutId);

            this.search.timeoutId = setTimeout(() => {
                //filter dropdown list based on search key parameter
                if (this.search.searchTerm.toLowerCase() !== searchTerm.toLowerCase()) {
                    this.search.processing = true;
                    this.search.searchTermRender = searchTerm;

                    // Allow processing shade to occur before change makes page hang
                    setTimeout(() => {
                        this.search.searchTerm = searchTerm;
                        this.search.processing = false;
                    }, 10);
                }
            }, delay);
        }
    };

}