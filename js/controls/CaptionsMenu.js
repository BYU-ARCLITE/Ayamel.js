/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 5/1/13
 * Time: 9:18 AM
 * To change this template use File | Settings | File Templates.
 */
(function (Ayamel) {
    "use strict";

    var template =
        '<div class="control button captions">\
            <div class="icon" title="Caption Menu"></div>\
            <div class="captionsMenu">\
                <div class="captionsMenuTipDark"></div>\
                <div class="captionsMenuTip"></div>\
                <div class="noCaptionTracks">No captions available.</div>\
            </div>\
        </div>';

    function CaptionsMenu(args) {
        var element = Ayamel.utils.parseHTML(template),
            menu = element.querySelector(".captionsMenu");

        this.element = element;
        args.holder.appendChild(element);
        this.length = 0;

        // Set up clicking to show the menu
        element.addEventListener('click', function (event) {
            event.stopPropagation();
            element.classList.toggle("active");
        },false);
        document.addEventListener('click', function () {
            element.classList.remove("active");
        },false);
        menu.addEventListener('click', function (event) {
            event.stopPropagation();
        },false);
    }

    CaptionsMenu.prototype.addTrack = function(track) {
        // Create the menu entry
        var that = this, emptyMessage,
			element = this.element,
            item = document.createElement('div');
		item.classList.add("captionsMenuEntry");
		item.textContent = track.label + ' (' + track.language + ')';
		
		emptyMessage = element.querySelector(".noCaptionTracks");
		if(emptyMessage !== null){ emptyMessage.parentNode.removeChild(emptyMessage); }
		
        element.querySelector(".captionsMenu").appendChild(item);
        if (track.mode === "showing") { item.classList.add("active"); }
        this.length++;

        // Set up clicking here because we have the track in scope
        item.addEventListener('click', function(e){
            var active = item.classList.contains("active");
            e.stopPropagation();
            if(that.length === 1){ element.classList.remove("active"); }
            item.classList.toggle("active");
            track.mode = active?'disabled':'showing';
            element.dispatchEvent(new CustomEvent(
                active?"disabletrack":"enabletrack",
                {bubbles:true,cancelable:true,detail:{track:track}}
            ));
        });
    };

    Ayamel.controls.captions = CaptionsMenu;
}(Ayamel));