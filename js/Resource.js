var ResourceLibrary = (function() {
    "use strict";

    /**
     * This is a cache of resources to reduce the number of calls that need to be made.
     */
    var cache = {};
    
    function Resource(data, url) {
        this.url = url;
        this.relations = null;
        if (data) {
            $.extend(this, data);
        }
    }
    
    Resource.prototype.getThumbnail = function() {
        if(this.content && this.content.files) {
            for (var i=0; i<this.content.files.length; i++) {
                var file = this.content.files[i];
                if (file.mime.substr(0,5) === "image" && file.representation === "summary")
                    return file.downloadUri;
            }
        }
        return null;
    };

    Resource.prototype.getRelations = function(callback) {
        var _this = this;

        if (this.relations) {
            callback();
        } else {
            $.ajax(this.url + "/relations", {
                dataType: "json",
                success: function(data) {
                    _this.relations = data.relations;
                    callback();
                }
            });
        }
    };

    Resource.prototype.loadResourcesFromRelations = function(relationRole, test, callback) {
        test = test || function (resource) { return true; };

        var filteredRelations = this.relations.filter(test);

        var baseUrl = this.url.substring(0, this.url.lastIndexOf("/")+1);
        async.map(filteredRelations, function(relation, asyncCallback) {

            // We have a relation. Get the resource
            var url = baseUrl + relation[relationRole];
            ResourceLibrary.load(url, function (resource) {
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
        load: function (url, callback) {
            if (cache[url]) {
                callback(cache[url]);
            } else {
                $.ajax(url, {
                    dataType: "json",
                    success: function(data) {
                        if (callback) {
                            var resource = new Resource(data.resource, url);
                            cache[url] = resource;
                            callback(resource);
                        }
                    }
                });
            }
        }
    };
}());