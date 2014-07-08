/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 10:01 AM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel) {
    "use strict";

    var template = '<div class="control button fullScreen" title="enter fullscreen"></div>';

    function FullScreenButton(args) {
        var _this = this,
            fullScreen = false,
            escpressed = false,
            element = Ayamel.utils.parseHTML(template);

        this.element = element;
        args.holder.appendChild(element);

        // Set up events
        element.addEventListener('click',function(e){
            e.stopPropagation();
			fullScreen = !fullScreen;
			if(fullScreen){
				element.title = "Exit Fullscreen";
				element.classList.add("active");
				element.dispatchEvent(new Event("enterfullscreen",{bubbles:true,cancelable:true}));
			}else{
				element.title = "Enter Fullscreen";
				element.classList.remove("active");
				element.dispatchEvent(new Event("exitfullscreen",{bubbles:true,cancelable:true}));
			}
        },false);

        // Be able to set the playing attribute
        Object.defineProperty(this, "fullScreen", {
            enumerable: true,
            set: function (value) {
                fullScreen = !!value;
				if(fullScreen){
					element.title = "Exit Fullscreen";
					element.classList.add("active");
				}else{
					element.title = "Enter Fullscreen";
					element.classList.remove("active");
				}
				return fullScreen;
            },
            get: function () {
                return fullScreen;
            }
        });

        if(typeof args.parent === 'object'){
            Object.defineProperties(args.parent, {
                fullScreen: {
                    enumerable: true,
                    set: function (value) {
                        return _this.fullScreen = !!value;
                    },
                    get: function () {
                        return fullScreen;
                    }
                }
            });
        }
    }
    Ayamel.controls.fullScreen = FullScreenButton;
}(Ayamel));