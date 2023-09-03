# MIT License
# Copyright (c) 2023 Andrew Hovey
# Full License Text: https://ahovey.com/MITLicense.html
# The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
# -----------------------------------------------------

import os
import util
import json
import shutil
import subprocess

from objectConfig import OBJECT_CONFIG

validObjects = OBJECT_CONFIG # Object Config defines which objects are accepted and the order in which they are upserted.

SMALL_SPACER = '==============='
allFilePaths = set()
objectRecords = {}
csvsByObject = {}

# Params
orgAlias = 'mySampleOrg'					# the sfdx org alias
csvDirectory = 'dataConfig/__csv'			# directory where the intermediate csv files will be stored
pythonCommand = 'python' 					# some installations use python3 rather than python
pythonScriptDir = 'dataConfig/__scripts'	# directory where the scripts are stored
sourceFilePaths = None						# Passed as a comma-separated list of config record file paths (enclose in quotes if spaces are used). This becomes an array when params are processed.
sourceFolderPaths = None					# Passed as a comma-separated list of folder paths (enclose in quotes if spaces are used). All deeply-nested config records in this folder will be processed. This becomes an array when params are procesed.
doUpsert = True								# True if csvs should be upserted (default). False if process should stop after generating csv files.

######################
### PROCESS PARAMS ###

def processParams():
	global orgAlias, csvDirectory, sourceFilePaths, sourceFolderPaths, pythonCommand, pythonScriptDir, doUpsert
	params = util.getArgParams()
	print('======= PARAMS =======\nThese can be set with full text flag, eg. --orgAlias mySampleOrg\n')

	# orgAlias
	orgAliasParam = ('orgAlias' in params.keys() and params['orgAlias'])
	if orgAliasParam:
		orgAlias = orgAliasParam
	print(f'orgAlias: {orgAlias}')

	# doUpsert
	doUpsertParam = ('doUpsert' in params.keys() and params['doUpsert'])
	if doUpsertParam and doUpsertParam.lower() == 'false':
		doUpsert = False
	elif doUpsertParam and doUpsertParam.lower() == 'true':
		doUpsert = True
	elif doUpsertParam:
		util.exitWithFailure('Expected true or false as value for --doUpsert param.')
	print(f'doUpsert: {doUpsert}')

	# csvDirectory
	csvDirectoryParam = ('csvDirectory' in params.keys() and params['csvDirectory'])
	if csvDirectoryParam:
		csvDirectory = csvDirectoryParam
	print(f'csvDirectory: {csvDirectory}')

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

	# sourceFilePaths
	sourceFilePathsParam = ('sourceFilePaths' in params.keys() and params['sourceFilePaths'])
	print(f'\n=== Source File Paths: ')
	if sourceFilePathsParam and isinstance(sourceFilePathsParam, str):
		sourceFilePaths = sourceFilePathsParam.split(',')
		for index, filePath in enumerate(sourceFilePaths):
			sourceFilePaths[index] = filePath.strip()
			print(sourceFilePaths[index])
	else:
		print('None')

	# sourceFolderPaths
	sourceFolderPathsParam = ('sourceFolderPaths' in params.keys() and params['sourceFolderPaths'])
	print(f'\n=== Source File Paths: ')
	if sourceFolderPathsParam and isinstance(sourceFolderPathsParam, str):
		sourceFolderPaths = sourceFolderPathsParam.split(',')
		for index, folderPath in enumerate(sourceFolderPaths):
			sourceFolderPaths[index] = folderPath.strip()
			print(sourceFolderPaths[index])
	else:
		print('None')

	print(f'\n{SMALL_SPACER}\n')


def consolidateFilePaths():
	global allFilePaths

	# Add direct file paths first:
	if sourceFilePaths:
		for filePath in sourceFilePaths:
			if os.path.isabs(filePath):
				filePath = os.path.relpath(filePath, '.')
			if filePath.lower().endswith('.json'):
				allFilePaths.add(filePath)

	# Recursively traverse folder paths and add applicable json files
	if not sourceFolderPaths:
		return
	for folderPath in sourceFolderPaths:
		absolutePath = folderPath
		if not os.path.isabs(absolutePath):
			absolutePath = os.getcwd() + '/' + folderPath

		for subdir, dirs, files in os.walk(absolutePath):
			for filePath in files:
				if filePath.lower().endswith('.json'):
					filePath = subdir + '/' + filePath
					if os.path.isabs(filePath):
						filePath = os.path.relpath(filePath, '.')
					allFilePaths.add(filePath)


def deleteTempFolder():
	if os.path.exists('__temp') and os.path.isdir('__temp'):
		shutil.rmtree('__temp')


def prepForConversion():
	global objectRecords
	deleteTempFolder()
	os.makedirs('__temp', exist_ok=True)
	acceptableObjectsLower = {}
	for objectName in validObjects.keys():
		acceptableObjectsLower[objectName.lower()] = objectName
	
	for fileName in allFilePaths:
		file = open(fileName, 'r', encoding='utf8')
		record = json.load(file)
		file.close()
		lowercaseObjectName = (record['__SObjectType'] or '').lower()
		if lowercaseObjectName in acceptableObjectsLower.keys():
			correctCaseObjectName = acceptableObjectsLower[lowercaseObjectName]
			os.makedirs('__temp/' + correctCaseObjectName, exist_ok=True)
			if correctCaseObjectName not in objectRecords.keys():
				objectRecords[correctCaseObjectName] = []
			fileNameOnly = os.path.basename(fileName)
			objectRecords[correctCaseObjectName].append(fileNameOnly[:-5]) # remove ".json" (5 characters)
			shutil.copy(fileName, f'__temp/{correctCaseObjectName}/{fileNameOnly}')


def convertToCsvs():
	print('\n\n===== CONVERT TO CSV FILES =====\n\n')
	global csvsByObject
	for objectName in validObjects.keys():
		if objectName not in objectRecords.keys():
			continue # Skip. We are iterating on validObjects to ensure correct order based on objectConfig.py
		command = [pythonCommand, f"{pythonScriptDir}/convertSourceToCsv.py"]
		command.extend(['--sourceFolder', f"__temp/{objectName}"])
		destinationFile = f"{csvDirectory}/{objectName}.csv"
		command.extend(['--destinationFile', destinationFile])
		recordNames = ','.join(objectRecords[objectName])
		command.extend(['--fileNames', recordNames])
		print(f'===== Convert source ({objectName})')
		print(command)
		subprocess.check_call(command) # Fails process if there was a failure
		csvsByObject[objectName] = destinationFile


def upsertRecords():
	print('\n\n===== UPSERT RECORDS =====\n\n')
	for objectName in csvsByObject.keys():
		sfdxCommand = ['sfdx', 'force:data:bulk:upsert']
		sfdxCommand.extend(['-u', orgAlias])
		sfdxCommand.extend(['-i', validObjects[objectName]['upsertField']])
		sfdxCommand.extend(['-f', csvsByObject[objectName]])
		sfdxCommand.extend(['-s', objectName])
		sfdxCommand.extend(['-w', '10'])
		print(f'===== SFDX Command ({objectName})')
		print(sfdxCommand)
		subprocess.check_call(sfdxCommand) # Fails process if there was a failure


def printPaths():
	print('=== FILE PATHS:')
	for objectName in csvsByObject.keys():
		print(f'{objectName}: {csvsByObject[objectName]}')



###############
### EXECUTE ###

def execute():
	print('\n\n================================================\n==========   UPSERT SALESFORCE CONFIG   ==========\n================================================\n')
	processParams()
	consolidateFilePaths()
	prepForConversion()
	convertToCsvs()

	printPaths()

	if doUpsert:
		upsertRecords()
	
	deleteTempFolder()
	
	print(f'\n\n{SMALL_SPACER}{SMALL_SPACER}{SMALL_SPACER}\n{SMALL_SPACER} PROCESS COMPLETE! {SMALL_SPACER}\n{SMALL_SPACER}{SMALL_SPACER}{SMALL_SPACER}')



execute()