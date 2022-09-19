
# Alert LWC Component

This component is based on the "Alert" SLDS Component Blueprint. (https://www.lightningdesignsystem.com/components/alert/)




## Content

The content of the alert is populated into the default slot. 
Any content can go here, such as links and other functionality.

```
<c-alert variant="WARNING">
    <div>
        Content goes here!
    </div>
    <div>
        <u onclick={handleClick} style="cursor: pointer;">
            Users can click for more information.
        </u>
    </div>
</c-alert>
```

![Screenshot](https://github.com/ahoveynow/SalesforceUtilities/blob/main/LWC/MISC_UTIL/lwc/alert/_readme_img/content.jpg?raw=true)


## API Properties

The following API properties can be set.

**variant**

    The high-level styling variant. Options are:
     - BASE (default)
     - WARNING
     - ERROR
     - CUSTOM

    When CUSTOM is specified, you can use the customBackgroundColor and 
    customTextColor properties.

**customBackgroundColor**

    When CUSTOM variant is specified, this property can contain a css-compatible string for
    the background color of the alert box.

**customTextColor**

    When CUSTOM variant is specified, this property can contain a css-compatible string for
    the text color of the text in the alert box.
    This is also the color of the icon if customIconColor is not set.

**customIcon**

    The SLDS Icon to use in the alert instead of the default.
    Icon should be in the form of "utility:info" and utility icons are preferred.
    https://www.lightningdesignsystem.com/icons/

**customIconColor**

    The css-compatible color for the icon.
    This value overrides customTextColor for the icon, if it is set.
    NOTE: This property does NOT work on the warning variant.

**suppressCloseButton**

    When this boolean flag is set, the close button is not presented on the alert,
    and the parent component can determine its own custom behavior for close.
    
    Note that the close button simply fires a "close" event to the parent, and
    does not hide the alert itself.


## Events

**close**

    The close event is fired when the user selects the close button on the alert.
    The parent should handle this event and hide the alert component as desired.


## Examples

![Screenshot](https://github.com/ahoveynow/SalesforceUtilities/blob/main/LWC/MISC_UTIL/lwc/alert/_readme_img/example_error-close-button-suppressed.jpg?raw=true)

![Screenshot](https://github.com/ahoveynow/SalesforceUtilities/blob/main/LWC/MISC_UTIL/lwc/alert/_readme_img/example_custom.jpg?raw=true)

![Screenshot](https://github.com/ahoveynow/SalesforceUtilities/blob/main/LWC/MISC_UTIL/lwc/alert/_readme_img/example_base-light-blue-icons.jpg?raw=true)

![Screenshot](https://github.com/ahoveynow/SalesforceUtilities/blob/main/LWC/MISC_UTIL/lwc/alert/_readme_img/example_warning-long-text.jpg?raw=true)

![Screenshot](https://github.com/ahoveynow/SalesforceUtilities/blob/main/LWC/MISC_UTIL/lwc/alert/_readme_img/example_warning-html-content.jpg?raw=true)