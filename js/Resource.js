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

    Resource.prototype.getTranscripts = function(callback) {
        var _this = this;
        $.ajax(this.url + "/relations", {
            dataType: "json",
            success: function(data) {
                if (callback) {
                    var transcripts = data.relations.filter(function (relation) {
                        return relation.type == "transcriptOf" && relation.objectId == _this.id;
                    });

                    if (transcripts.length === 0) {
                        callback([]);
                    }

                    // Get all the resources associated with the transcript relations
                    // We will use an asynchronous functional combinator to get the job done cleanly.
                    var baseUrl = _this.url.substring(0, _this.url.lastIndexOf("/")+1);
                    async.map(transcripts, function(transcriptRelation, asyncCallback) {

                        // We have a relation. Get the resource
                        $.ajax(baseUrl + transcriptRelation.subjectId, {
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