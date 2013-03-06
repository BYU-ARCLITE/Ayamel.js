Ayamel.js
=========

Client-side services and display elements for the Flagship Media Library interface.

Scripts, purposes, and usage
----------------------------
**actor.js**
Um... I'm not sure how this fits in.

**annotator.js**
Used for annotating stuff. You can call it with one of the following:

    Annotator.HTML(config, content);
    Annotator.Text(config, content);
    
I'm not sure what each does or what the arguments are.

**async.js**
Don't know.

**Ayamel.js**
This is the starting point of the Ayamel scripts. This defines a namespace contained within the <code>Ayamel</code> object. It also defines an AyamelElement which is used as the prototype for other elements. You'll never call just the Ayamel object, but one of the sub objects which each require a separate script to work properly. These include:
 + TimedMedia
 + VideoPlayer
 + Video
 + Text

**ControlBar.js**
This is the control bar for media controller. This creates a graphical interface that can be used to control media playback. This is a customizable alternative to <code>MediaControls.js</code>.

Depends upon (so be sure to include):
 + <code>ProgressBar.js</code>
 + <code>ControlBarComponents.js</code>
 + JQuery

You shouldn't ever need to call it, as it's called from <code>MediaController.js</code>

**ControlBarComponents.js**
This defines a bunch of components that can be added to the control bar. You shouldn't ever need to call this, as you can define the components through the video player.

Depends upon:
 + JQuery

**h5Clip.js**
This script defines the HTML5 video player installer which can be used to support HTML5 video.

Requires:
 + <code>video.js</code>

To use the installer, do one of the following:

    Ayamel.AddVideoPlayer(h5PlayerInstall, priority, callback);
    Ayamel.InstallVideoPlayers([h5PlayerInstall, ...], callback)
    
For a description of these functions, see <code>video.js</code>

**language_modules.js**
No idea.

**MediaController.js**
TODO later.

**MediaControls.js**
TODO later.

**ProgressBar.js**
TODO later.

**Text.js**
Um...

**textmenu.js**
No idear.

**TimedMedia.js**
Later

**UniformAspectRatio.js**
Later

**video.js**
This adds video support. Provides video player installers.

Requires:
 + <code>TimedMedia.js</code>

It provides the following video player installers within the Ayamel namespace:

    /**
     * Installs a video player
     * @param installer The video installer.
     * @param priority The priority of the player. Lower the number the more preferred the player
     * @param callback A callback function
     */
    Ayamel.AddVideoPlayer(installer, priority, callback)
    
    /**
     * Installs multiple video players.
     * @param installers An array of video installers. The order is the priority
     * @param callback A callback function
     */
    Ayamel.InstallVideoPlayers(installers, callback)

**VideoPlayer.js**
Later