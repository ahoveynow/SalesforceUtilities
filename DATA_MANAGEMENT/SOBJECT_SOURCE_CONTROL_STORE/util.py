# MIT License
# Copyright (c) 2023 Andrew Hovey
# Full License Text: https://ahovey.com/MITLicense.html
# The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
# -----------------------------------------------------


import sys

params = None
currentKey = None
currentVal = None

def exitWithFailure(message):
    print('\n\n')
    print('=====================')
    print('====== FAILURE ======\n')
    print(message)
    print('\n=====================\n\n')
    quit()



def getArgParams():
    global params, currentKey, currentVal

    if params:
        return params
    params = {}

    arguments = []
    for index, arg in enumerate(sys.argv):
        arguments.append(arg)

    params['__file'] = arguments[0]

    ### storeCurrentParam Method ###
    def storeCurrentParam():
        global params, currentKey, currentVal
        
        if currentKey is not None:
            if currentVal is not None:
                params[currentKey] = currentVal
            else:
                # no value means it was a single flag with no value
                params[currentKey] = True

            currentKey = None
            currentVal = None
    ### END storeCurrentParam Method ###

    for element in arguments[1:]:
        # Element is a key
        if element[0] == '-': # eg. -v
            # If we have been processing a previous param, store it
            storeCurrentParam()
        
            if element[1] == '-': # double dash, eg. --version
                currentKey = element[2:]
            else:
                currentKey = element[1:]
        
        # Element is a value
        else:
            currentVal = element

    storeCurrentParam()
    return params
