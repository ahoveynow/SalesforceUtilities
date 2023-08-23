# MIT License
# Copyright (c) 2023 Andrew Hovey
# Full License Text: https://ahovey.com/MITLicense.html
# The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
# -----------------------------------------------------

# https://github.com/ahoveynow/SalesforceUtilities/blob/main/DATA_MANAGEMENT/SOBJECT_SOURCE_CONTROL_STORE

# The OBJECT_CONFIG dictionary configures each object to store records for:
OBJECT_CONFIG = {
	'Some_Object_1__c': {
		'name': 'Some_Object_1__c', # Must match the dictionary key
		'upsertField': 'Name', # The field that will be used for upsert. Can be name or another indexed field.
		'whereClause': "", # Any SOQL WHERE conditions to include when querying the records. Other clauses may be included as well, if necessary (eg. LIMIT)
		'fields': [ # an array of fields (including relationship fields) to query
			'Name',
			'Some_Field_A__c',
			'Some_Field_B__c',
			'Related_Record__r.Name',
		]
	},
}
