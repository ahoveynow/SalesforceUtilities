# MIT License
# Copyright (c) 2023 Andrew Hovey
# Full License Text: https://ahovey.com/MITLicense.html
# The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
# -----------------------------------------------------

# USAGE:
# python3 convertSourceToCsv.py 
#   --sourceFolder dataConfig/Some_Config__c
#   --destinationFile Some_Config__c_to_upsert.csv


import util
import csv
import os
import json

# Params
sourceFolder = None
destinationFile = None

# Other variables
records = []



######################
### PROCESS PARAMS ###

def processParams():
    global sourceFolder, destinationFile
    params = util.getArgParams()

    # sourceFolder
    sourceFolder = ('sourceFolder' in params.keys() and params['sourceFolder'])
    if not sourceFolder:
        util.exitWithFailure('You must specify the source folder with the --sourceFolder flag')
    print(f'sourceFolder: {sourceFolder}')

    # destinationFile
    destinationFile = ('destinationFile' in params.keys() and params['destinationFile'])
    if not destinationFile:
        util.exitWithFailure('You must specify the destination csv file with the --destinationFile flag.')
    print(f'destinationFile: {destinationFile}')



######################################
### COMPILE DICTIONARY FROM SOURCE ###

def compileDictFromSource():
    global records
    records = []

    for fileName in os.listdir(sourceFolder):
        fileName = os.path.join(sourceFolder, fileName)
        file = open(fileName, 'r')
        record = json.load(file)
        file.close()
        records.append(record)

    print(f'Records: {len(records)}')



############################
### WRITE RECORDS TO CSV ###

def writeRecordsToCsv():
    fields = set(())
    for record in records:
        for fieldName in record.keys():
            if fieldName == '__SObjectType':
                continue
            fields.add(fieldName)

    os.makedirs(os.path.dirname(destinationFile), exist_ok=True)
    with open(destinationFile, 'w') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames = sorted(fields), extrasaction = 'ignore')
        writer.writeheader()
        writer.writerows(records)



###############
### EXECUTE ###

def execute():
    processParams()
    compileDictFromSource()
    writeRecordsToCsv()



execute()