
# Generate Apex Documentation

The python script generateApexDocs.py will recursively traverse the specified code directory to find all the apex classes (.cls files). 
It then uses the SfApexDocs.jar file to generate Apex documentation for those files. 
SfApexDocs is a 3rd party tool that is documented here: https://gitlab.com/StevenWCox/sfapexdoc 

The .jar file can be found on that website. Until I investigate the legality of copying the file here, you will need to download the file directly from the gitlab page (https://gitlab.com/StevenWCox/sfapexdoc/-/wikis/home).

To run this file, execute "python generateApexDocs.py" using a command line. You may want to set some of the variables at the beginning of the script for custom behavior specific to your folder structure.