# [Simple Lightbox](http://www.dominic-c.com/simple-lightbox) 

## Major features
* With very little work, grab images from a variety of popular photo services 
* No javascript dependencies! (all just vanilla JS)
* Very accessability friendly
* Animations entirely relient on CSS - very performant
* Eventing system for hooking into from the outside :loudspeaker:
* Themeable out of the box
* Tons of options for configuration :neckbeard:

##Getting started
Once you've cloned the repo to your machine, start by inlcuding the two CSS files and one JS file on your page like below.

```html
<html>
	<head>
		<link href="slb-styles.css" rel="stylesheet" />
		<link href="slb-default-theme.css" rel="stylesheet" />
	</head>
	<body>
		<script src="/slb.js"></script>
	</body>
</html>
```

Now, create an instance of the lightbox like below

```js
var light_box = new SimpleLightBox({
	photoService: "flickr", 
	photoServiceApiKey: "<YourAPIKey>"
});
```

In this example, the lightbox will retrieve a set of photos from Flickr, using the passed in API Key to do so. If you don't have an api key from Flickr, just grab one [here](https://www.flickr.com/services/apps/create/) quick.

To open the lightbox, just call open() on your instance like this:
```js
light_box.open();
```
And that's it! There are a bunch of ways to customize your lightbox, control it programmatically, etc. Just keep scrolling down for more. 

##Configuration
Most features of the lightbox have a default value, but feel free to override them when creating your lightbox instance.

###options
* _container_ -- 
	selector for container to append lightbox to - defaulted to body
* _scrollSpeed_ -- 
	speed at which images scroll by in millseconds - defaulted to 600ms
* _startingSlide_ -- 
	slide to start gallery on by integer starting from 1 - defaulted to 1
* _themeClass_ -- 
	style class to add to lightbox. This is how you control the theme of your lightbox - defaulted to "default"
* _showDots_ -- 
	boolean to show dot indicators or not - defaulted to true
* _showOverlay_ -- 
	boolean to show the background overlay or not - defaulted to true
* _overlayOpacity_ -- 
	percent of opacity of the background overlay - defaulted to 85
* _overlayColor_ -- 
	color of the background overlay - defaulted to "#000"
* _closeOnOverlayClick_ -- 
	boolean for closing the lightbox on click of background overlay - defaulted to true
* _photoService_ -- 
	which photo service to gather images from - no default - currently supports "flickr" or "instagram"
* _photoServiceApiKey_ -- 
	your photo service api key for the above chosen photoService
* _renderOnInit_ -- 
	boolean for whether or not to render the html of the lightbox on initializtion or not - defaulted to true
* _requestImagesOnInit_ -- 
	boolean for whether or not to request images from the above chosen photoService on initialization or not - defaulted to true

```js
	var light_box = new SimpleLightBox({
		container: 'body',
		scrollSpeed: 600,
		startingSlide: 1,
		themeClass: 'default',
		showDots: true,
		showOverlay: true,
		overlayOpacity: 85,
		overlayColor: "#000",
		closeOnOverlayClick: true,
		photoService: "flickr", 
		photoServiceApiKey: "<YourAPIKey>",
		renderOnInit: true,
		requestImagesOnInit: true
	});

	light_box.open();
```
##Event System
If you'd like to react to things happening in your lightbox, just set a listener callback for an event like this:

```js
	var light_box = new SimpleLightBox({
		photoService: "flickr", 
		photoServiceApiKey: "<YourAPIKey>"
	});

	light_box.on("slideDone", function(lightBox) {
		console.log("New current slide: ", lightBox.status.currentSlide);
	});
```

###Events
* slideStart
* slideDone
* beforeInit
* afterInit
* beforeImageRequest
* imageRequestResponse
* imageRequestResponseError
* afterImageRequest
* beforeClose
* afterClose
* beforeNext
* afterNext
* beforeOpen
* afterOpen
* beforePrev
* afterPrev
* beforeRender
* afterRender

##Themes
Simple Lightbox comes with a default theme CSS file. If you'd like to creatae your own theme, just include the CSS file on your page and pass in a themeClass into your options. The themeClass shoud correspond with whatever parent style class you used in your theme's CSS.

```js
	var light_box = new SimpleLightBox({
		themeClass: "my-awesome-theme",
		photoService: "flickr", 
		photoServiceApiKey: "<YourAPIKey>"
	});
```

##Methods
The lightbox can be controlled entirely through methods on your instance. These are the available methods:

* _close()_ - Closes the lightbox
* _destroy()_ - Destroys the lightbox, removing it from the DOM and killing it's event listners
* _next()_ - Slide to the next image
* _off(evtName)_ - Stop lightbox from listening to passed in eventName string
* _on(evtName, callback, ctx)_ - On eventName string call passed in callback with the passed in context ctx
* _once(evtName, callback, ctx)_ - Just like .on() but will only fire a single time
* _open()_ - Opens the lightbox
* _prev()_ - Slide to the previous image
* _render()_ - Render the html necessary for the lightbox. It's recommended to let the lightbox take care of this for you. 
* _slideTo(slideNum)_ - Slide to the passed in number
* _trigger (evtName, data)_ - trigger event associated with passed in evtName string passing along the data argument to your listeners

##Example
See an example of it running [here](http://www.dominic-c.com/simple-lightbox).