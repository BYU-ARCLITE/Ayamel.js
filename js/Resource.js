var ResourceLibrary = (function() {
    "use strict";
    
    function Resource(data, url) {
        this.url = url;
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

    function getRelations(resource, test, callback, relationRole) {
        $.ajax(resource.url + "/relations", {
            dataType: "json",
            success: function(data) {
                if (callback) {
                    var relations = data.relations.filter(test);

                    // Get all the resources associated with the transcript relations
                    // We will use an asynchronous functional combinator to get the job done cleanly.
                    var baseUrl = resource.url.substring(0, resource.url.lastIndexOf("/")+1);
                    async.map(relations, function(relation, asyncCallback) {

                        // We have a relation. Get the resource
                        $.ajax(baseUrl + relation[relationRole], {
                            dataType: "json",
                            success: function(data) {
                                asyncCallback(null, data.resource);
                            }
                        });
                    }, function (err, results) {
                        callback(results);
                    });
                }
            }
        });
    }

    Resource.prototype.getTranscripts = function(callback) {
        var _this = this;
        var test = function (relation) {
            return relation.type == "transcriptOf" && relation.objectId == _this.id;
        };
        getRelations(this, test, callback, "subjectId");
    };

    Resource.prototype.getAnnotations = function(callback) {
        var _this = this;
        var test = function (relation) {
            return relation.type == "references" && relation.objectId == _this.id && relation.attributes.type === "annotations";
        };
        getRelations(this, test, callback, "subjectId");
    };
    
    return {
        load: function (url, callback) {
            $.ajax(url, {
                dataType: "json",
                success: function(data) {
                    if (callback) {
                        var resource = new Resource(data.resource, url);
                        callback(resource);
                    }
                }
            });
        }
    };
}());