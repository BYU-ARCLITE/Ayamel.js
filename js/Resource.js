var ResourceLibrary = (function() {
	"use strict";

	var baseUrl = "";

	/**
	 * This is a cache of resource requests to reduce the number of calls that need to be made.
	 */
	var reqcache = {};

	function Resource(data, id) {
		var key;
		this.id = id;
		this.relations = [];
		for(key in data) if(data.hasOwnProperty(key)) {
			this[key] = data[key];
		}
	}

	Resource.prototype.loadResourcesFromRelations = function(relationRole, test, callback){
		var filteredRelations = (typeof test === 'function')?this.relations.filter(test,this):this.relations;
		var p = Promise.all(filteredRelations.map(function(relation){
			return ResourceLibrary.load(relation[relationRole]);
		}));
		if(typeof callback ==='function'){ p.then(callback); }
		return p;
	};

	Resource.prototype.getTranscriptIds = function(){
		return this.relations.filter(function(relation){
			return relation.type == "transcript_of" && relation.objectId == this.id;
		},this).map(function(relation){ return relation.subjectId; });
	};

	Resource.prototype.getTranscripts = function(additionalTest, callback){
		return this.loadResourcesFromRelations("subjectId", function(relation){
			var isTranscript = relation.type == "transcript_of" && relation.objectId == this.id,
				passTest = (typeof additionalTest === 'function')?additionalTest(relation):true;
			return isTranscript && passTest;
		}, callback);
	};

	Resource.prototype.getAnnotationIds = function(){
		return this.relations.filter(function(relation){
			return relation.type == "references" && relation.objectId == this.id && relation.attributes.type === "annotations";
		},this).map(function(relation){ return relation.subjectId; });
	};

	Resource.prototype.getAnnotations = function(additionalTest, callback){
		return this.loadResourcesFromRelations("subjectId", function(relation){
			var isAnnotations = relation.type == "references" && relation.objectId == this.id && relation.attributes.type === "annotations",
				passTest = (typeof additionalTest === 'function')?additionalTest(relation):true;
			return isAnnotations && passTest;
		}, callback);
	};

	function getResourcePromise(id){
		return new Promise(function(resolve, reject){
			var xhr = new XMLHttpRequest();
			xhr.addEventListener("load", function(){
				if(this.status >= 200 && this.status < 400){
					try {
						resolve(new Resource(JSON.parse(this.responseText).resource, id));
					}catch(e){
						reject(e);
					}
				}else{
					reject(new Error(this.responseText));
				}
			}, false);
			xhr.addEventListener("error", function(){ reject(new Error("Request Failed")); }, false);
			xhr.addEventListener("abort", function(){ reject(new Error("Request Aborted")); }, false);
			xhr.open("GET",baseUrl + "resources/" + id + "?" + Date.now().toString(36),true);
			xhr.send(null);
		});
	}

	function load(id, callback){
		if(!reqcache.hasOwnProperty(id)){ reqcache[id] = getResourcePromise(id); }
		if(typeof callback === 'function'){ reqcache[id].then(callback); }
		return reqcache[id];
	}

	return {
		Resource: Resource,
		setBaseUrl: function(url){ baseUrl = url; },
		load: load,
		loadAll: function(ids, callback){
			var p = Promise.all(ids.map(load));
			if(typeof callback === 'function'){ p.then(callback); }
			return p;
		}
	};
}());