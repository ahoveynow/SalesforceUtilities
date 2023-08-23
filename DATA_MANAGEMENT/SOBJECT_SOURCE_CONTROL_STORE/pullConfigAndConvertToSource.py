# MIT License
# Copyright (c) 2023 Andrew Hovey
# Full License Text: https://ahovey.com/MITLicense.html
# The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
# -----------------------------------------------------

# USAGE (from repo root):
# python dataConfig/__scripts/pullConfigAndConvertToSource.py
#	--orgAlias qap02
#	--objects "Some_Object_1__c, Some_Object_2__c"

# USAGE (from dataConfig/__scripts directory):
# python pullConfigAndConvertToSource.py
#	--orgAlias qap02
#	--csvDirectory ../__csv
#	--destinationFolder ../
#	--pythonScriptDir ./
#	--objects "Some_Object_1__c, Some_Object_2__c"

import os
import util

from objectConfig import OBJECT_CONFIG

validObjects = OBJECT_CONFIG

SMALL_SPACER = '==============='


# Params
orgAlias = 'qap01'							# the sfdx org alias
csvDirectory = 'dataConfig/__csv'			# directory where the intermediate csv files will be stored
destinationFolder = 'dataConfig'			# directory where the source control config records will reside
pythonCommand = 'python' 					# some installations use python3 rather than python
pythonScriptDir = 'dataConfig/__scripts'	# directory where the scripts are stored
objects = validObjects.keys()				# Passed as a comma-separated list of object API names to be processed (enclose in quotes if spaces are used). This becomes an array when params are processed.



######################
### PROCESS PARAMS ###

def processParams():
	global orgAlias, csvDirectory, objects, destinationFolder, pythonCommand, pythonScriptDir
	params = util.getArgParams()
	print('======= PARAMS =======\nThese can be set with full text flag, eg. --orgAlias devd01\n')

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

	# pythonCommand
	pythonCommandParam = ('pythonCommand' in params.keys() and params['pythonCommand'])
	if pythonCommandParam:
		pythonCommand = pythonCommandParam
	print(f'pythonCommand: {pythonCommand}')

	# pythonScriptDir
	pythonScriptDirParam = ('pythonScriptDir' in params.keys() and params['pythonScriptDir'])
	if pythonScriptDirParam:
		pythonScriptDir = pythonScriptDirParam
	print(f'pythonScriptDir: {pythonScriptDir}')

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
	queryCommand = f'sfdx force:data:soql:query --resultformat csv -u {orgAlias} --query "SELECT {",".join(objectDetails["fields"])} FROM {objectDetails["name"]} {objectDetails["whereClause"]} " > "{csvDirectory}/{objectDetails["name"]}.csv"'
	print(queryCommand)
	os.system(queryCommand)




#############################
### CONVERT CSV TO SOURCE ###

def convertCsvToSource(objectDetails):
	print(f'Converting {objectDetails["name"]} into source control...')
	convertCommand = f'{pythonCommand} "{pythonScriptDir}/convertCsvToSource.py" --sourceFile "{csvDirectory}/{objectDetails["name"]}.csv" --destinationFolder "{destinationFolder}/{objectDetails["name"]}" --upsertField {objectDetails["upsertField"]} --objectName {objectDetails["name"]}'
	print(convertCommand)
	os.system(convertCommand)




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
			convertCsvToSource(validObjects[validObjectName])
	
	print(f'\n\n{SMALL_SPACER}{SMALL_SPACER}{SMALL_SPACER}\n{SMALL_SPACER} PROCESS COMPLETE! {SMALL_SPACER}\n{SMALL_SPACER}{SMALL_SPACER}{SMALL_SPACER}')



execute()
