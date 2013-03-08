var ytPlayerInstall = function(host,global,callback){
    
    var player;
    
	function ytClip(id, start, stop) {
        // Add an empty container that will be added to the video player
        var template = '<div class="youtubeHolder"><div id="youtubePlayer"></div></div>',
            $element = $(template),
            _this = this,
            lastTime = 0,
            stateCount = 0;
            
        this.media_el = $element.get(0);
        
        // Set a timeout before initializing the youtube player so the container
        // will be added to the document (it needs to be otherwise the smf
        // embedding doesn't work).
        setTimeout(function() {
            swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&version=3",
                "youtubePlayer", "250", "250", "8", null, null,
                { allowScriptAccess: "always", wmode: "transparent" }, { id: "myytplayer" });
        }, 100);
        
        function timeUpdateWatcher() {
            if (player) {
                var time = player.getCurrentTime();
                if (time !== lastTime) {
                    lastTime = time;
                    _this.wrapper.callHandlers("timeupdate");
                }
            }
            setTimeout(function() {
                timeUpdateWatcher();
            }, 50);
        }
        
        global.stateChangeHandler = function (state) {
            if (state === 2) {
                stateCount++;
                
                // Update the duration
                _this.stop = player.getDuration();
                _this.duration = _this.stop - _this.start;
                _this.wrapper.parent.controls.duration = _this.duration;
                
            }
            console.log("State change: " + state);
        }
        
        // Define the youtube player ready callback
        global.onYouTubePlayerReady = function() {
            player = $("#myytplayer").get(0);
            player.addEventListener("onStateChange", "stateChangeHandler");
            
            player.loadVideoById(id);
            player.pauseVideo();
            
            // Adjust the size
            $(player).width("100%").height("100%");
            
            timeUpdateWatcher();
            
            // Send a duration change event to tell things we're ready to go!
            _this.wrapper.callHandlers("durationchange");
            
        };
        
        this.media = this;
	}
    
    ytClip.prototype = Object.create(host.VideoClipPrototype, {
		Play: {
			value: function () {
				if (player) {
					player.playVideo();
				}
			}
		},
		Pause: {
			value: function () {
				if (player) {
                    player.pauseVideo();
				}
			}
		},
        mediaTime: {
		    set: function (value) {
				value = Math.round(Number(value));
				if (player) {
                    player.seekTo(value, true);
				}
			},
            get: function () {
                if (player) {
                    return player.getCurrentTime();
				}
                return 0;
            }
		},
		muted: {
			set: function (value) {
                if (player) {
    				value = Boolean(value);
                    if (value) {
                        player.mute();
                    } else {
                        player.unMute();
                    }
                }
			},
			get: function () {
                if (player) {
                    return player.isMuted();
                }
                return false;
            },
			enumerable: true
		},
		volume: { // The volume as a percentage
			set: function (value) {
                if (player) {
                    player.setVolume(Number(value));
                }
			},
			get: function () {
                if (player) {
                    return player.getVolume();
                }
                return 100;
            },
			enumerable: true
		},
		mediaDuration: {
			get: function () {
                if (player) {
                    return player.getDuration();
                }
                return 0;
            },
			enumerable: true
		}
	});
    
    callback(function(res,start,stop){
            
        // Check the stream uris in the resource files for a youtube video
        for (var i = 0; i < res.content.files.length; i += 1) {
            var file = res.content.files[i];
            
            // Check that there is a youtube uri
            if (file.streamUri && /youtube:\/\//.test(file.streamUri)) {
                
                // Attempt to make the clip
                return new ytClip(file.streamUri.substr(10), start, stop);
            }
        }
        return false;
	});
	
};