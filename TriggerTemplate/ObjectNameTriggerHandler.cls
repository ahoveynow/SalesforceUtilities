/* Class is without sharing because it is for a trigger,
 * which runs in System Context. */
public without sharing class ObjectNameTriggerHandler {

    ObjectNameTriggerHelper helper = new ObjectNameTriggerHelper();

    /***********************/
    /*** BEFORE TRIGGERS ***/

    public void beforeInsert(List<ObjectName> records) {}

    public void beforeUpdate(Map<Id, ObjectName> oldMap, Map<Id, ObjectName> newMap) {}

    public void beforeDelete(Map<Id, ObjectName> oldMap) {}


    /**********************/
    /*** AFTER TRIGGERS ***/

    public void afterInsert(Map<Id, ObjectName> newMap) {}

    public void afterUpdate(Map<Id, ObjectName> oldMap, Map<Id, ObjectName> newMap) {}

    public void afterDelete(Map<Id, ObjectName> oldMap) {}

    public void afterUndelete(Map<Id, ObjectName> newMap) {}
}