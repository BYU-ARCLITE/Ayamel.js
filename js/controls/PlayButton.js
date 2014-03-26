/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 10:01 AM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel) {
    "use strict";

    var template = '<div class="control button play paused" title="play"></div>';

    function PlayButton(args) {
        var _this = this,
            playing = false,
            $element = $(template),
			element = $element[0];

        this.$element = $element;
        this.element = element;
        args.$holder.append($element);

        // Set up events
        element.addEventListener('click',function (e) {
            e.stopPropagation();
            element.dispatchEvent(new Event(playing?'pause':'play',{bubbles:true,cancelable:true}));
        },false);

        // Be able to set the playing attribute
        Object.defineProperty(this, "playing", {
            enumerable: true,
            get: function () {
                return playing;
            },
            set: function (value) {
                playing = !!value;
				if(playing){
					element.title = "pause";
					element.classList.remove('paused');
				}else{
					element.title = "play";
					element.classList.add('paused');
				}
                return playing;
            }
        });

        if(typeof args.parent === 'object'){
            Object.defineProperties(args.parent, {
                playing: {
                    enumerable: true,
                    set: function (value) {
                        return _this.playing = !!value;
                    },
                    get: function () {
                        return playing;
                    }
                }
            });
        }
    }

    Ayamel.controls.play = PlayButton;
}(Ayamel));