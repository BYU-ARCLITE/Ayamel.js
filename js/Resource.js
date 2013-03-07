var Resource = (function() {
    "use strict";
    
    function Resource(url, callback) {
        var _this = this;
        this.id = url || new Date().getTime();
        
        // If the ID was provided then get the resource via AJAX
        if (url) {
            $.ajax(url, {
                dataType: "json",
                success: function(data) {
                    $.extend(_this, data.resource);
                    if (callback) {
                        callback(_this);
                    }
                }
            });
        }
    }
    
    Resource.prototype.getThumbnail = function() {
        if(this.content && this.content.files) {
            this.content.files.forEach(function (file) {
                if (file.mime.substr(0,5) === "image" && file.representation === "summary")
                    return file.downloadUri;
            });
        }
        return null;
    };
    
    return Resource;
}());