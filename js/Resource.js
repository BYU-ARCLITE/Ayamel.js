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

	Resource.prototype.loadResourcesFromRelations = function(relationRole, test, callback) {
		var filteredRelations = (typeof test === 'function')?this.relations.filter(test):this.relations;
		var p = Promise.all(filteredRelations.map(function(relation) {
			return ResourceLibrary.load(relation[relationRole]);
		}));
		if(typeof callback ==='function'){ p.then(callback); }
		return p;
	};

	Resource.prototype.getTranscripts = function(callback, additionalTest) {
		this.loadResourcesFromRelations("subjectId", function (relation) {
			var isTranscript = relation.type == "transcriptOf" && relation.objectId == _this.id,
				passTest = (typeof additionalTest === 'function')?additionalTest(relation):true;
			return isTranscript && passTest;
		}, callback);
	};

	Resource.prototype.getAnnotations = function(callback, additionalTest) {
		this.loadResourcesFromRelations("subjectId", function (relation) {
			var isAnnotations = relation.type == "references" && relation.objectId == _this.id && relation.attributes.type === "annotations",
				passTest = (typeof additionalTest === 'function')?additionalTest(relation):true;
			return isAnnotations && passTest;
		}, callback);
	};


	function getResourcePromise(id){
		var xhr = new XMLHttpRequest();
		return new Promise(function(resolve, reject){
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
			xhr.open("GET",baseUrl + "resources/" + id + "?" + Date.now().toString(36), {dataType: "json"},true);
            xhr.send();
		});
	}

	return {
		setBaseUrl: function(url) { baseUrl = url; },
		load: function (id, callback) {
			if(!reqcache.hasOwnProperty(id)){ reqcache[id] = getResourcePromise(id); }
			if(typeof callback === 'function'){ reqcache[id].then(callback); }
			return reqcache[id];
		},
		Resource: Resource
	};
}());