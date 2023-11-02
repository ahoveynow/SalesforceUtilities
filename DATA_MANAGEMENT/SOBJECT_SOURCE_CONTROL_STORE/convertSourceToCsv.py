# MIT License
# Copyright (c) 2023 Andrew Hovey
# Full License Text: https://ahovey.com/MITLicense.html
# The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
# -----------------------------------------------------

# https://github.com/ahoveynow/SalesforceUtilities/blob/main/DATA_MANAGEMENT/SOBJECT_SOURCE_CONTROL_STORE

# USAGE:
# python3 convertSourceToCsv.py 
#	--sourceFolder dataConfig/Some_Config__c
#	--destinationFile Some_Config__c_to_upsert.csv
#	--fileNames "EXT-123,a8eJs77a,Some Config Upsert Value"


import util
import csv
import os
import json

# Params
sourceFolder = None
destinationFile = None
fileNames = None 	# eg: "Record key 73,EXT-123,a8eJs77a,Some Config Upsert"
					# To include all records (default), don't use this param
					# spaces around values will be trimmed, eg. "  Some Val  ,  Value2 " resolves to "Some Val,Value2"
					# Don't include the .json file extension

# Other variables
records = []
fileNamesArray = None


######################
### PROCESS PARAMS ###

def processParams():
	global sourceFolder, destinationFile, fileNames, fileNamesArray
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

	# fileNames
	fileNames = ('fileNames' in params.keys() and params['fileNames'])
	if fileNames:
		fileNamesArray = fileNames.split(',')
		for index, fileName in enumerate(fileNamesArray):
			fileNamesArray[index] = fileName.strip()
		print(f'fileNames: {fileNames}')



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
		
		if fileNamesArray and record[record['__upsertField']] not in fileNamesArray:
			continue # If only including a subset, and this file is not part of that subset, skip it.

		# There are some nuances to setting blank values
		# For non-lookup fields, a blank value must be set as "#N/A"
		# For lookup fields, we use external IDs (eg. Related_Object__r.Name)
		#  - When setting a value for a lookup field,  Related_Object__r.External_ID__c should have the value (eg. "Some Name"), and Related_Object__c should be an empty string ("")
		#  - When the value is blank for lookup field, Related_Object__r.External_ID__c should be an empty string (""), and Related_Object__c should be "#N/A"
		processedRecord = {}
		for field_name, field_value in record.items():
			if '.' in field_name:
				externalIdField = field_name
				directLookup = None # The lookup field someone would query to get the ID of the related record.

				lookupField = field_name.split('.')[0]
				if (lookupField[-1] == 'r'): # Custom field
					directLookup = lookupField.rstrip('r') + 'c' # Object__r.Name becomes Object__c
				else: # Standard field
					directLookup = lookupField + 'Id' # Account.Name becomes AccountId

				if field_value == "":
					processedRecord[externalIdField] = ""
					processedRecord[directLookup] = "#N/A"
				else:
					processedRecord[externalIdField] = field_value
					processedRecord[directLookup] = ""
			else:
				processedRecord[field_name] = field_value if field_value != "" else "#N/A"

		records.append(processedRecord)

	print(f'Records: {len(records)}')



############################
### WRITE RECORDS TO CSV ###

def writeRecordsToCsv():
	fields = set(())
	for record in records:
		for fieldName in record.keys():
			if fieldName == '__SObjectType' or fieldName == '__upsertField':
				continue
			fields.add(fieldName)

	os.makedirs(os.path.dirname(destinationFile), exist_ok=True)
	with open(destinationFile, 'w', newline='', encoding='utf8') as csvfile:
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
