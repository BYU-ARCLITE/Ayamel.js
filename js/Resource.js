var ResourceLibrary = (function() {
	"use strict";

	var baseUrl = "";

	/**
	 * This is a cache of resources to reduce the number of calls that need to be made.
	 */
	var reqcache = {},
		rescache = {};

	function Resource(data, id) {
		this.id = id;
		this.relations = null;
		if (data) {
			$.extend(this, data);
		}
	}

	Resource.prototype.getRelations = function(callback) {
		var _this = this;
		if (this.relations) {
			callback();
		} else {
			var url = baseUrl + "relations?id=" + this.id + "&nocache=" + Date.now().toString(36);
			$.ajax(url, {
				dataType: "json",
				success: function(data) {
					_this.relations = data.relations;
					callback();
				}
			});
		}
	};

	// TODO: Change this
	Resource.prototype.loadResourcesFromRelations = function(relationRole, test, callback) {
		test = test || function (resource) { return true; };

		var filteredRelations = this.relations.filter(test);

		async.map(filteredRelations, function(relation, asyncCallback) {
			// We have a relation. Get the resource
			ResourceLibrary.load(relation[relationRole], function (resource) {
				asyncCallback(null, resource);
			});
		}, function (err, results) {
			callback(results);
		});
	};

	Resource.prototype.getTranscripts = function(callback, additionalTest) {
		var _this = this;
		var test = function (relation) {
			var isTranscript = relation.type == "transcriptOf" && relation.objectId == _this.id;
			var passesAdditionalTest = true;
			if (additionalTest)
				passesAdditionalTest = additionalTest(relation);
			return isTranscript && passesAdditionalTest;
		};
		this.getRelations(function () {
			_this.loadResourcesFromRelations("subjectId", test, callback);
		});
	};

	Resource.prototype.getAnnotations = function(callback, additionalTest) {
		var _this = this;
		var test = function (relation) {
			var isAnnotations = relation.type == "references" && relation.objectId == _this.id && relation.attributes.type === "annotations";
			var passesAdditionalTest = true;
			if (additionalTest)
				passesAdditionalTest = additionalTest(relation);
			return isAnnotations && passesAdditionalTest;
		};
		this.getRelations(function () {
			_this.loadResourcesFromRelations("subjectId", test, callback);
		});
	};

	return {
		setBaseUrl: function(url) {
			baseUrl = url;
		},
		load: function (id, callback) {
			if(!reqcache.hasOwnProperty(id)) {
				reqcache[id] = $.ajax(baseUrl + "resources/" + id + "?" + Date.now().toString(36), {dataType: "json"});
			}
			reqcache[id].then(function(data){
				if(!rescache.hasOwnProperty(id)){
					rescache[id] = new Resource(data.resource, id);
				}
				if(typeof callback === 'function'){
					callback(rescache[id]);
				}
			});
		},
		Resource: Resource
	};
}());