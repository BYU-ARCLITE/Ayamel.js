# Ayamel.js

Client-side services and display elements for the Flagship Media Library interface.

##Scripts, purposes, and usage

###actor.js
Um... I'm not sure how this fits in.

**Dependencies:**
 + `Ayamel.js`

###annotator.js
Used for annotating stuff. You can call it with one of the following:

```javascript
Annotator.HTML(config, content);
```
    
Annotates HTML.

Parameter | Type | Description
--- | ---| ---
config | Object | Configuration. Not sure exactly what it needs/can contain.
content | DOM Element? | The content to annotate

***

```javascript
Annotator.Text(config, content);
```
    
Annotates text.

Parameter | Type | Description
--- | ---| ---
config | Object | Configuration. Not sure exactly what it needs/can contain.
content | String? | The content to annotate

**Dependencies:**
 + *None*

###async.js
Don't know.

**Dependencies:**
 + *None*

###Ayamel.js
This is the starting point of the Ayamel scripts. This defines a namespace contained within the `Ayamel` object. It also defines an AyamelElement which is used as the prototype for other elements. You'll never call just the Ayamel object, but one of the sub objects which each require a separate script to work properly. These include:
 + TimedMedia
 + VideoPlayer
 + Video
 + Text

**Dependencies:**
 + *None*

**Used by:**
 + `actor.js`
 + `MediaController.js`
 + `Text.js`
 + `TimedMedia.js`
 + `UniformAspectRatio.js`
 + `video.js`
 + `VideoPlayer.js`

###ControlBar.js
This is the control bar for media controller. This creates a graphical interface that can be used to control media playback. This is a customizable alternative to `MediaControls.js`.

**Dependencies:**
 + `ProgressBar.js`
 + `ControlBarComponents.js`
 + jQuery

**Used by:**
 + `MediaController.js`

You shouldn't ever need to call it, as it's called from `MediaController.js`

###ControlBarComponents.js

This defines a bunch of components that can be added to the control bar. You shouldn't ever need to call this, as you can define the components through the video player.

**Dependencies:**
 + jQuery

**Used by:**
 + `ControlBar.js`
 
### h5Clip.js
This script defines the video player installer which can be used to support HTML5 video.

**Dependencies:**
 + `Ayamel.js`
 + `video.js`

To use the installer, do one of the following:

```javascript
Ayamel.AddVideoPlayer(h5PlayerInstall, priority, callback);
Ayamel.InstallVideoPlayers([h5PlayerInstall, ...], callback)
```
    
For a description of these functions, see `video.js`

### language_modules.js
Something to do with languages.

**Dependencies:**
 + *None*

### MediaController.js

As the name suggests, this is a controller for media. This connects the media player with the controls.

**Dependencies:**
 + `Ayamel.js`
 + `ControlBar.js` or `MediaControls.js`

**Used by:**
 + `VideoPlayer.js`

### MediaControls.js
Provides a graphical interface for controlling media. Can use `ControlBar.js` instead.

**Dependencies:**
 + *None*

**Used by:**
 + `MediaController.js`

### ProgressBar.js

The progress bar used by the control bar.

**Dependencies:**
 + jQuery

**Used by:**
 + `ControlBar.js`

### swfobject.js
Used to load flash objects onto the page.

**Dependencies:**
 + *None*

**Used by:**
 + `ytClip.js`

### Text.js
Has to do with text somehow.

**Dependencies:**
 + `Ayamel.js`
 + `TextMenu.js`

### textmenu.js
A menu for text?

**Used by:**
 + `TextMenu.js`

### TimedMedia.js
An abstract layer for working with timed media (video, audio).

**Dependencies:**
 + `Ayamel.js`

**Used by:**
 + `video.js`

### UniformAspectRatio.js
This helps maniuplate DOM Elements such that a certain aspect ratio can be maintained.

**Dependencies:**
 + `Ayamel.js`

**Used by:**
 + `VideoPlayer.js`

### video.js
This adds video support. Provides video player installers.

**Dependencies:**
 + `TimedMedia.js`

It provides the following video player installers within the Ayamel namespace:

```javascript
Ayamel.AddVideoPlayer(installer, priority, callback)
```

Installs a video player.

Parameter | Type | Description
--- | ---| ---
installer | Player installer | The video player installer.
priority | integer | The priority of the player. The lower the number the more preferred the player
callback | function | A callback function

***

```javascript
Ayamel.InstallVideoPlayers(installers, callback)
```
    
Installs multiple video players.
    
Parameter | Type | Description
--- | ---| ---
installers | Array of player installers | The list of video players to install. The order is the priority.
callback | function | A callback function

### VideoPlayer.js

An interface for creating video players on the page.

**Dependencies:**
 + `Ayamel.js`
 + `MediaController.js`
 + `UniformAspectRatio.js`

To create a video player, do the following:

```javascript
var player = Ayamel.VideoPlayer(parameters);
```
    
Creates a video player on the page.

`parameters` is an object. The following are valid within it:

Parameter | Type | Description | Required
--- | --- | --- | ---
aspectRatio | Number | The ratio of height to width on a scale of 100. 50 is a square. | Yes
components | Array of strings | The components to add to the player. | No
element | DOM Element | The element where the video player will be added. | Yes
resource | Resource | The video resource that will be played. | Yes

Valid components include:
 + `play` The play/pause button
 + `volume` The volume control
 + `captions` Caption track selection. For more information, see `ControlBar.js`
 + More coming soon!

### ytClipjs

This script defines the video player installer which can be used to support YouTube videos.

**Dependencies:**
 + `Ayamel.js`
 + `swfobject.js`
 + `video.js`

To use the installer, do one of the following:

```javascript
Ayamel.AddVideoPlayer(ytPlayerInstall, priority, callback);
Ayamel.InstallVideoPlayers([ytPlayerInstall, ...], callback)
```
    
For a description of these functions, see `video.js`