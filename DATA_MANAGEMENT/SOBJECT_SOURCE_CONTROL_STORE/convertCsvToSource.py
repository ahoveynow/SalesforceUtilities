# MIT License
# Copyright (c) 2023 Andrew Hovey
# Full License Text: https://ahovey.com/MITLicense.html
# The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
# -----------------------------------------------------

# USAGE:
# python3 csvToSource.py 
#   --sourceFile ../Some_Config__c_from_org.csv 
#   --destinationFolder dataConfig
#   --upsertField Static_ID__c
#   --objectName Some_Config__c


import util
import csv
import os
import json

# Params
sourceFile = None
destinationFolder = None
upsertField = None
objectName = None

# Other variables
csvFileRecords = []



######################
### PROCESS PARAMS ###

def processParams():
    global sourceFile, destinationFolder, upsertField, objectName
    params = util.getArgParams()

    # sourceFile
    sourceFile = ('sourceFile' in params.keys() and params['sourceFile'])
    if not sourceFile:
        util.exitWithFailure('You must specify the csv source file with the --sourceFile flag')
    print(f'sourceFile: {sourceFile}')

    # destinationFolder
    destinationFolder = ('destinationFolder' in params.keys() and params['destinationFolder'])
    if not destinationFolder:
        util.exitWithFailure('You must specify the destination folder with the --destinationFolder flag. Do not include the object name in this path.')
    print(f'destinationFolder: {destinationFolder}')

    # upsertField
    upsertField = ('upsertField' in params.keys() and params['upsertField'])
    if not upsertField:
        util.exitWithFailure('You must specify the Object\'s upsert field with the --upsertField flag')
    print(f'upsertField: {upsertField}')

    # objectName
    objectName = ('objectName' in params.keys() and params['objectName'])
    if not objectName:
        util.exitWithFailure('You must specify the Object\'s API name with the --objectName flag')
    print(f'objectName: {objectName}')



###########################
### EXTRACT CSV RECORDS ###

def extractCsvRecords():
    global csvFileRecords

    csvFileContent = open(sourceFile)
    csvReader = csv.DictReader(csvFileContent)
    csvFileRecords = []
    for csvRow in csvReader:
        csvRow['__SObjectType'] = objectName
        csvFileRecords.append(csvRow)

    # TEMPORARY FIX DUE TO CLI BUG: https://github.com/forcedotcom/cli/issues/1447
    for record in csvFileRecords:
        for fieldName in record:
            if record[fieldName] == 'null':
                record[fieldName] = ''



###################################
### WRITE RECORDS TO JSON FILES ###

def writeRecordsToJsonFiles():
    folderLocation = f'{destinationFolder}/{objectName}'
    os.makedirs(folderLocation, exist_ok=True)

    for record in csvFileRecords:
        fileName = f'{folderLocation}/{record[upsertField]}.json'
        print(f'Writing to {fileName}')
        fileToWrite = open(fileName, 'w')
        fileToWrite.write(json.dumps(record, indent = 4, sort_keys=True))
        fileToWrite.close()



###############
### EXECUTE ###

def execute():
    processParams()
    extractCsvRecords()
    writeRecordsToJsonFiles()



execute()