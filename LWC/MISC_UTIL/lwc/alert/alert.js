/**
 * MIT License
 * Copyright (c) 2022 Andrew Hovey
 * Full License Text: https://ahovey.com/MITLicense.html
 * The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
 */

import { LightningElement, api, track } from 'lwc';

export const VARIANTS = {
    BASE: 'BASE',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CUSTOM: 'CUSTOM',
};

/**
 * Alert banners communicate a state that affects the entire system, not just a feature or page.
 * It persists over a session and appears without the user initiating the action.
 * 
 * Handle the "onclose" event in the parent to hide this component.
 * 
 * This component is based on the alert SLDS component blueprint.
 * @see https://www.lightningdesignsystem.com/components/alert/
 */
export default class Alert extends LightningElement {

    /**
     * The variant for styling this alert.
     * @type {VARIANTS}
     */
    @api variant = VARIANTS.BASE;

    /**
     * Prevents the close icon from being presented to the user. 
     * @type {Boolean}
     */
    @api suppressCloseButton = false;

    /**
     * A css-compatible color for the background.
     * IMPORTANT: This property is only used if the CUSTOM variant is specified.
     * @type {String}
     */
    @api customBackgroundColor = '#747474';

    /**
     * A css-compatible color for the text.
     * If no customIconColor is specified, this value is also the color for the icon.
     * 
     * IMPORTANT: This property is only used if the CUSTOM variant is specified.
     * @type {String}
     */
    @api customTextColor = '#FFFFFF';

    /**
     * The Icon to display in the alert.
     * Must be a valid slds icon, preferably from the utility category.
     * 
     * @type {String}
     * @see https://www.lightningdesignsystem.com/icons/
     * @example 'utility:info'
     */
    @api customIcon;

    /**
     * A custom css-compatible color for the icon.
     * If set, this value will override other defined colors, regardless of variant.
     * @type {String}
     */
    @api customIconColor;




    /***************/
    /*** GETTERS ***/
    /***************/

    get iconAdditionalStyle() {
        if (this.customIconColor) { return `--lwc-colorTextIconDefault: ${this.customIconColor};`; }
        if (this.variant === VARIANTS.CUSTOM && this.customTextColor) { return `--lwc-colorTextIconDefault: ${this.customTextColor};`; }
        if (this.variant === VARIANTS.BASE) { return '--lwc-colorTextIconDefault: white;'; }
        return '';
    }

    get iconName() {
        if (this.customIcon) { return this.customIcon; }
        if (this.variant === VARIANTS.ERROR) { return 'utility:error'; }
        if (this.variant === VARIANTS.WARNING) { return 'utility:warning'; }
        return 'utility:info';
    }

    get wrapperAdditionalStyle() {
        if (this.variant !== VARIANTS.CUSTOM) { return ''; }
        return `background-color: ${this.customBackgroundColor}; color: ${this.customTextColor}`;
    }

    get wrapperCssClasses() {
        let classes = 'slds-notify slds-notify_alert ';

        if (this.variant === VARIANTS.WARNING) {
            classes += ' slds-alert_warning';
        }

        if (this.variant === VARIANTS.ERROR) {
            classes += ' slds-alert_error';
        }

        return classes;
    }




    /**************************/
    /***** EVENT HANDLERS *****/
    /**************************/

    handleClose = async () => {
        this.dispatchEvent(new CustomEvent('close'));
    }
}