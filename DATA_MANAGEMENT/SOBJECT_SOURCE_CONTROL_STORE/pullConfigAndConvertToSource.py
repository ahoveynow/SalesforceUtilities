# MIT License
# Copyright (c) 2023 Andrew Hovey
# Full License Text: https://ahovey.com/MITLicense.html
# The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
# -----------------------------------------------------

# https://github.com/ahoveynow/SalesforceUtilities/blob/main/DATA_MANAGEMENT/SOBJECT_SOURCE_CONTROL_STORE

# USAGE (from repo root):
# python dataConfig/__scripts/pullConfigAndConvertToSource.py
#	--orgAlias mySampleOrg
#	--objects "Some_Object_1__c, Some_Object_2__c"

# USAGE (from dataConfig/__scripts directory):
# python pullConfigAndConvertToSource.py
#	--orgAlias mySampleOrg
#	--csvDirectory ../__csv
#	--destinationFolder ../
#	--objects "Some_Object_1__c, Some_Object_2__c"

import os
import util
import convertCsvToSource

from objectConfig import OBJECT_CONFIG

validObjects = OBJECT_CONFIG

SMALL_SPACER = '==============='


# Params
orgAlias = 'mySampleOrg'					# the sfdx org alias
csvDirectory = 'dataConfig/__csv'			# directory where the intermediate csv files will be stored
destinationFolder = 'dataConfig'			# directory where the source control config records will reside
objects = validObjects.keys()				# Passed as a comma-separated list of object API names to be processed (enclose in quotes if spaces are used). This becomes an array when params are processed.



######################
### PROCESS PARAMS ###

def processParams():
	global orgAlias, csvDirectory, objects, destinationFolder
	params = util.getArgParams()
	print('======= PARAMS =======\nThese can be set with full text flag, eg. --orgAlias mySampleOrg\n')

	# orgAlias
	orgAliasParam = ('orgAlias' in params.keys() and params['orgAlias'])
	if orgAliasParam:
		orgAlias = orgAliasParam
	print(f'orgAlias: {orgAlias}')

	# csvDirectory
	csvDirectoryParam = ('csvDirectory' in params.keys() and params['csvDirectory'])
	if csvDirectoryParam:
		csvDirectory = csvDirectoryParam
	print(f'csvDirectory: {csvDirectory}')

	# destinationFolder
	destinationFolderParam = ('destinationFolder' in params.keys() and params['destinationFolder'])
	if destinationFolderParam:
		destinationFolder = destinationFolderParam
	print(f'destinationFolder: {destinationFolder}')

	# objects
	objectsParam = ('objects' in params.keys() and params['objects'])
	if objectsParam:
		objects = objectsParam.split(',')
		for index, object in enumerate(objects):
			objects[index] = object.strip()
	print(f'objects: {",".join(objects)}')

	print(f'\n{SMALL_SPACER}\n')




########################
### VALIDATE OBJECTS ###

def validateObjects():
	print('Validating Objects...')
	valid = True
	validKeys = validObjects.keys()

	for object in objects:
		if object not in validKeys:
			print(f'{object} is not supported.')
			valid = False
	
	if (not valid):
		print('Terminating Pull.')
		exit()
	else:
		print('Validated.')

	print('\n======================\n')




#####################
### QUERY RECORDS ###

def queryRecords(objectDetails):
	print(f'Querying records for {objectDetails["name"]}...')
	os.makedirs(csvDirectory, exist_ok=True)
	csvFileName = f'{csvDirectory}/{objectDetails["name"]}.csv'
	queryCommand = f'sfdx force:data:soql:query --result-format csv --wait 10 -u {orgAlias} --query "SELECT {",".join(objectDetails["fields"])} FROM {objectDetails["name"]} {objectDetails["whereClause"]} " > "{csvFileName}"'
	print(queryCommand)
	os.system(queryCommand)

	# Remove warnings
	csvLines = []
	with open(csvFileName, 'r', encoding='utf8') as fileReader:
		csvLines = fileReader.readlines()
	
	with open(csvFileName, 'w', encoding='utf8') as fileWriter:
		startOfFileFound = False
		for number, line in enumerate(csvLines):
			if not startOfFileFound and line.startswith('Warning:'):
				continue
			startOfFileFound = True
			fileWriter.write(line)




#############################
### CONVERT CSV TO SOURCE ###

def convertCsvToSourceForObject(objectDetails):
	objectName = objectDetails["name"]
	print(f'Converting {objectName} into source control...')
	jsonFields = validObjects[objectName].get('jsonFields')
	if jsonFields and len(jsonFields) > 0:
		jsonFields = ','.join(jsonFields)
	else:
		jsonFields = ''

	parameters = {
		'sourceFile': f'{csvDirectory}/{objectDetails["name"]}.csv',
		'destinationFolder': f'{destinationFolder}/{objectDetails["name"]}',
		'upsertField': objectDetails["upsertField"],
		'objectName': objectDetails["name"],
		'jsonFields': jsonFields
	}
	convertCsvToSource.execute(parameters)




###############
### EXECUTE ###

def execute():
	print('\n\n================================================\n==========   PULL SALESFORCE CONFIG   ==========\n================================================\n')
	processParams()
	validateObjects()

	currentIndex = 0
	print('Processing Objects...')
	for validObjectName in validObjects.keys():
		if validObjectName in objects:
			currentIndex += 1
			print(f'{SMALL_SPACER}\nOBJECT {currentIndex} of {len(objects)}: {validObjectName}\n{SMALL_SPACER}\n')
			queryRecords(validObjects[validObjectName])
			convertCsvToSourceForObject(validObjects[validObjectName])
	
	print(f'\n\n{SMALL_SPACER}{SMALL_SPACER}{SMALL_SPACER}\n{SMALL_SPACER} PROCESS COMPLETE! {SMALL_SPACER}\n{SMALL_SPACER}{SMALL_SPACER}{SMALL_SPACER}')


if __name__ == '__main__':
	execute()
