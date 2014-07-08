/**
 * Created with IntelliJ IDEA.
 * User: camman3d
 * Date: 4/30/13
 * Time: 10:01 AM
 * To change this template use File | Settings | File Templates.
 */
(function(Ayamel) {
    "use strict";

    //taken from VTT codec
    function generateTimeCode(time){
        var seconds = Math.floor(time),
            minutes = Math.floor(seconds/60),
            hh,mm,ss,ms,text;
        hh = Math.floor(minutes/60);
        mm = (minutes%60);
        ss = (seconds%60);
        //ms = Math.floor(1000*(time-seconds));
        text = (hh>0?(hh>9?hh:"0"+hh)+":":"");
        return text+(mm>9?mm:"0"+mm)+":"+(ss>9?ss:"0"+ss);//+"."+(ms>99?ms:(ms>9?"0"+ms:"00"+ms));
    }

    function TimeCode(args) {
        var _this = this,
            duration = 0, currentTime = 0,
            durationText = "00:00", currentTimeText = "00:00",
            element = document.createElement('div');

        element.classList.add("timeCode");
        element.title = "timecode";

        function updateText() {
            element.textContent = currentTimeText + " / " + durationText;
        }

        updateText();

        this.element = element;
        args.holder.appendChild(element);

        Object.defineProperties(this, {
            currentTime: {
                enumerable: true,
                set: function (value) {
                    currentTime = +value || 0;
                    currentTimeText = generateTimeCode(currentTime);
                    updateText();
                    return currentTime;
                },
                get: function () {
                    return currentTime;
                }
            },
            duration: {
                enumerable: true,
                set: function (value) {
                    duration = +value || 0;
                    durationText = generateTimeCode(duration);
                    updateText();
                    return duration;
                },
                get: function () {
                    return duration;
                }
            }
        });
    }

    Ayamel.controls.timeCode = TimeCode;
}(Ayamel));