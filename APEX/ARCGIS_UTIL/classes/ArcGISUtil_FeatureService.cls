/**
 * MIT License
 * Copyright (c) 2022 Andrew Hovey
 * Full License Text: https://ahovey.com/MITLicense.html
 * The above abbreviated copyright notice shall be included in all copies or substantial portions of the Software.
 */

public inherited sharing class ArcGISUtil_FeatureService {
    
    // Set these values according to your own needs. They can be hardcoded or dynamic:
    public static String featureServiceEndpointUrl;
    public static Integer timeout = 10000;
    public static String method = 'POST'; // POST | GET -- Only used for services that allow either
    public static Map<String, String> additionalRequestHeaders = new Map<String, String> {};

	
    /***************************/
    /***** DELETE FEATURES *****/
    /***************************/
    // Documentation: https://developers.arcgis.com/rest/services-reference/enterprise/delete-features.htm

    public static DeleteFeaturesResponse deleteFeatures (DeleteFeaturesOptions options) {
        HttpHexFormBuilder form = HttpHexFormBuilder.build();

        Map<String, Object> paramMap = options.getMap();
        for (String key: paramMap.keySet()) {
            if (paramMap.get(key) == null) { continue; }
            form.writeParam(key, '' + paramMap.get(key));
        }
        Blob formData = form.getFormAsBlob();

        HttpRequest request = new HttpRequest();
        request.setEndpoint(featureServiceEndpointUrl + 'deleteFeatures');
        request.setMethod('POST'); // deleteFeatures is only supported via POST
        request.setHeader('Content-Type', HttpHexFormBuilder.GetContentType());
        request.setHeader('Content-Length', String.valueOf(formData.size()));
        request.setBodyAsBlob(formData);
        request.setTimeout(timeout);
        for (String headerKey: additionalRequestHeaders.keySet()) {
	    	if (additionalRequestHeaders.get(headerKey) != null) {
            	request.setHeader(headerKey, additionalRequestHeaders.get(headerKey));
			}
        }

        HttpResponse response = new Http().send(request);
        String responseBody = response.getBody();

        try {
            DeleteFeaturesResponse result = (DeleteFeaturesResponse)JSON.deserialize(responseBody, DeleteFeaturesResponse.class);
            if (result.deleteResults == null) { throw new ArcGISFeatureServiceException('Expected deleteResults property.'); } // Error
            return result;
        } catch (Exception err) {
            String errorString = 'Could not deserialize API response to expected structure: ' + err.getMessage() + '\n';
            errorString += 'API Response Body: \n' + responseBody;
            throw new ArcGISFeatureServiceException(errorString);
        }
    }


    public inherited sharing class DeleteFeaturesOptions {
        public String f = 'json'; // html | json | pjson
        public List<String> objectIds = new List<String>();
        public String whereClause; // this is the "where" parameter, but "where" is a reserved word in Apex
        public String geometry;
        public String geometryType; // esriGeometryPoint | esriGeometryMultipoint | esriGeometryPolyline | esriGeometryPolygon | esriGeometryEnvelope
        public String inSR;
        public String spatialRel; // esriSpatialRelIntersects | esriSpatialRelContains | esriSpatialRelCrosses | esriSpatialRelEnvelopeIntersects | esriSpatialRelIndexIntersects | esriSpatialRelOverlaps | esriSpatialRelTouches | esriSpatialRelWithin
        public String gdbVersion;
        public Boolean returnEditMoment = false;
        public Boolean rollbackOnFailure = true;
        public Boolean returnDeleteResults = true;
        public Boolean async = false;

        public Map<String, Object> getMap() {
            Map<String, Object> optionsMap = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(this));
            optionsMap.put('where', optionsMap.get('whereClause'));
            return optionsMap;
        }
    }


    public inherited sharing class DeleteFeaturesResponse {
        public List<DeleteFeaturesResponseResult> deleteResults;
    }


    public inherited sharing class DeleteFeaturesResponseResult {
        public Integer objectId;
        public Integer globalId;
        public Boolean success;
        public DeleteFeaturesResponseError error;
    }


    public inherited sharing class DeleteFeaturesResponseError {
        public Integer code;
        public String description;
    }

	
	
	
    /*****************/
    /***** QUERY *****/
    /*****************/
    // Documentation: https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-.htm

    public static QueryResponse query (QueryOptions queryParameters) {
        HttpHexFormBuilder form = HttpHexFormBuilder.build();

        Map<String, Object> paramMap = queryParameters.getMap();
        for (String key: paramMap.keySet()) {
            if (paramMap.get(key) == null) { continue;}
            form.writeParam(key, '' + paramMap.get(key));
        }
        Blob formData = form.getFormAsBlob();

        HttpRequest request = new HttpRequest();
        request.setEndpoint(featureServiceEndpointUrl + 'query');
        request.setMethod(method);
        request.setHeader('Content-Type', HttpHexFormBuilder.GetContentType());
        request.setHeader('Content-Length', String.valueOf(formData.size()));
        request.setBodyAsBlob(formData);
        request.setTimeout(timeout);
        for (String headerKey: additionalRequestHeaders.keySet()) {
			if (additionalRequestHeaders.get(headerKey) != null) {
            	request.setHeader(headerKey, additionalRequestHeaders.get(headerKey));
			}
        }

        HttpResponse response = new Http().send(request);
        String responseBody = response.getBody();

        try {
            QueryResponse result = (QueryResponse)JSON.deserialize(responseBody, QueryResponse.class);
			if (result.features == null) { throw new ArcGISFeatureServiceException('Expected feature property.'); } // Error
            return result;
        } catch (Exception err) {
            String errorString = 'Could not deserialize API response to expected structure: ' + err.getMessage() + '\n';
            errorString += 'API Response Body: \n' + responseBody;
            throw new ArcGISFeatureServiceException(errorString);
        }
    }


    public inherited sharing class QueryOptions {
        public String whereClause; // this is the "where" parameter, but "where" is a reserved word in Apex
        public List<String> objectIds;
        public String geometry;
        public String geometryType; // esriGeometryPoint | esriGeometryMultipoint | esriGeometryPolyline | esriGeometryPolygon | esriGeometryEnvelope
        public String inSR;
        public String spatialRel; // esriSpatialRelIntersects | esriSpatialRelContains | esriSpatialRelCrosses | esriSpatialRelEnvelopeIntersects | esriSpatialRelIndexIntersects | esriSpatialRelOverlaps | esriSpatialRelTouches | esriSpatialRelWithin
        public Long timeParam; // this is the "time" parameter, but "Time" is a standard Class in Apex
        public Integer distance;
        public String units; // esriSRUnit_Meter | esriSRUnit_StatuteMile | esriSRUnit_Foot | esriSRUnit_Kilometer | esriSRUnit_NauticalMile | esriSRUnit_USNauticalMile
        public String outFields;
        public Boolean returnGeometry = true;
        public Integer maxAllowableOffset;
        public Integer geometryPrecision;
        public String outSR;
        public String havingClause;
        public String gdbVersion;
        public Boolean returnIdsOnly = false;
        public Boolean returnCountOnly = false;
        public Boolean returnExtentOnly = false;
        public String orderByFields;
        public String groupByFieldsForStatistics;
        public Boolean returnZ = false;
        public Boolean returnM = false;
        public String multipatchOption; // xyFootprint | stripMaterials | embedMaterials | externalizeTextures
        public Integer resultOffset;
        public Integer resultRecordCount;
        public String quantizationParameters;
        public Boolean returnCentroid = false;
        public Long historicMoment;
        public Boolean returnTrueCurves = false;
        public String sqlFormat = 'none'; // none | standard | native
        public Boolean returnExceededLimitFeatures = true;
        public String f = 'json'; // html | json | pjson


        public Map<String, Object> getMap() {
            Map<String, Object> optionsMap = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(this));
            optionsMap.put('where', optionsMap.get('whereClause'));
            optionsMap.put('time', optionsMap.get('timeParam'));
            return optionsMap;
        }
    }


    public inherited sharing class QueryResponse {
        public String objectIdFieldName;
        public String globalIdFieldName;
        public String geometryType;
        public SpatialReference spatialReference;
        public List<ResponseField> fields;
        public List<Feature> features;
    }


    /**************************************/
    /***** GENERAL SUPPORTING CLASSES *****/
    /**************************************/

    public class ArcGISFeatureServiceException extends Exception {}


    public interface Feature {
        //public FeatureAttributes attributes;
        //public String geometry; // Must be ESRI JSON format
    }


    public interface FeatureAttributes {
        //public Integer OBJECTID;
    }


    public inherited sharing class ResponseField {
        public String name;
        public String alias;
        public String type;
        public Integer length;
    }


    public inherited sharing class SpatialReference {
        public Integer wkid;
        public Integer latestWkid;
    }
}
