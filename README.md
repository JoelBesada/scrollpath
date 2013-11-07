jQuery Scroll Path
==================
**NOTE: I am no longer maintaining this project. If anyone is interested in resurrecting this, please contact me on Twitter ([@JoelBesada](https://twitter.com/joelbesada)) or send an email to the address found on my GitHub profile.** 

A jQuery plugin for defining a custom path that the browser
follows when scrolling.

Demo: http://joelb.me/scrollpath

Author: Joel Besada (http://www.joelb.me)  
Version: 1.1.1 (2012-02-20)   
Copyright 2012, Joel Besada   

MIT Licensed (http://www.opensource.org/licenses/mit-license.php)

Introduction
---------------
jQuery Scroll Path is a plugin that lets you define your own custom scroll path. What this means exactly is best understood by [checking out the demo](http://joelb.me/scrollpath). The plugin uses canvas flavored syntax for drawing paths, using the methods moveTo, lineTo and arc. To help with getting the path right, a canvas overlay with the path can be enabled when initializing the plugin.

Scrolling can be done with the mousewheel, up/down arrow keys and spacebar. The spacebar scrolls faster than the arrow keys, and holding shift while pressing space will scroll backwards. A custom scrollbar is also included, which allows click and drag scrolling. The scrollbar is enabled by default.

The plugin also allows rotating the entire page, using CSS transforms. This can be done either along a path, or around the current position. In browsers without CSS transform support, all rotations are ignored, but paths are still followed. This means the plugin works with graceful degradation in all browsers.

As of version 1.1, the plugin also allows you to animate the scroll position to a given waypoint in the path.

__Are you using jQuery Scroll Path on any of your sites?__ I'd love to hear about it, and I might include links here for showcasing the plugin being used in the wild.


Using the Plugin
---------------
This guide aims to help you with getting started using the plugin. In addition to reading this, it's recommended that you check out the marked section of the _script/demo.js_ file, for a usage example.
### The Files
To include the plugin on your page, grab the _jquery.scrollpath.js_ file from the _script/_ folder of this repo, or the [minified version](http://joelb.me/scrollpath/jquery.scrollpath.min.js). If you want to include the scrollbar, make sure to include the _scrollpath.css_ stylesheet from _style/_ as well. 

__Note: This plugin requires jQuery 1.7+__

### Drawing the Path
To start drawing your path, we need to get the `Path` object from the plugin. This is done by calling `$.fn.scrollPath("getPath");`, which returns the object. For anyone who has used canvas before, you can think of the `Path` object the same way as the canvas context object. 

You can also change the default scrolling speeds by adding an object as a parameter with `scrollSpeed` and `rotationSpeed` properties set:

	var path = $.fn.scrollPath("getPath", {
		scrollSpeed: 80, // Default is 50
		rotationSpeed: Math.PI / 10 // Default is Math.PI / 15
	});
	// Use the various path drawing methods below on the path variable

Note that the rotation speed only applies when rotating around a set position.

The `Path` object has a number of methods for drawing the path. The moveTo, lineTo and arc methods work exactly the same way as their canvas equivalents. If you are new to drawing paths on a canvas, check out the canvas [lines](http://www.html5canvastutorials.com/tutorials/html5-canvas-lines/) and [arcs](http://www.html5canvastutorials.com/tutorials/html5-canvas-arcs/) explanations. The options parameter is optional in all methods.

#### moveTo( x, y [,options] )
Moves the center of the screen to a specified coordinate. This is done in a single step (i.e. the screen 'jumps' to the given point).

#### lineTo( x, y [,options] )
Draws a straight line from the current position to the given point. 

#### arc( centerX, centerY, radius, startAngle, endAngle, counterclockwise [,options] )
Draws an arc with its center at coordinate (centerX, centerY) with the given radius. The start and end angles are in radians, and the counterclockwise boolean decides which direction the path is drawn between the angles. If the starting point of the arc isn't the same as the end point of the preceding path, a straight line is automatically drawn between the points.

I recommend reading [this tutorial about arcs](http://www.html5canvastutorials.com/tutorials/html5-canvas-arcs/) for a more in-depth explanation of how the different parameters work.

#### rotate( radians [,options])
Rotates the screen around the current position to the given radian angle. These rotations aren't added to the path if the browser doesn't support CSS transforms.

#### The Options Parameter
The optional `options` parameter takes an object with the properties `rotate`, `callback` and `name`. The rotate property is used to rotate to a given radian angle when moving along the path. The callback property lets you specify a function that will be called every time the __end point__ of the path is reached. Specifying the name property allows you to set a reference to the end point of the path, which can later be used as a target for the `scrollTo` method.

Here is an example of a named path, rotating a full rotation along a line and firing an alert at the end:

	path.lineTo(500,500, {
		rotate: 2 * Math.PI,
		callback: function() {
			alert("You've reached the end!");
		},
		name: "myPath"
	});

### Initializing the Plugin
Once you're done drawing your path on the `Path` object, all that's left to do is to initialize the plugin on a container element which contains all the elements you want to scroll around. When you're doing this, there are three more settings that can be changed: `drawPath`, `wrapAround` and `scrollBar`. 

The `drawPath` boolean decides whether a canvas overlay with the path should be drawn. This can be used to make it easier for you to see exactly how the path you've made looks, and should probably only be used for debugging purposes. This is set to `false` by default.

Setting `wrapAround` to 'true' will make the path loop, which means that once you reach the end of the scroll path and go down another step, you'll scroll back to the beginning. This works the other way around too. This is also set to `false` by default.

The `scrollBar` setting enables or disables the scroll bar, which is enabled by default.

Here's an example:

	$(".your-container-element").scrollPath({
		drawPath: true,
		wrapAround: true,
		scrollBar: false
	});

Once you initialize the plugin, it will automatically center the screen to the first point in the path. While scrolling, the plugin will also always make sure that the center of the screen follows the path. Also, whenever the window is resized, the plugin makes sure it re-centers itself.

__You should now have everything set up and ready to go!__

### Scrolling Programmatically (Animations)
	$.fn.scrollPath( "scrollTo", name [, duration, easing, complete] );
	
Once the plugin has been initialized, you can use the `scrollTo` method above to animate or jump (with `duration` set to 0) to given points in the path. These points are specified with the name parameter, which you can set on the different path end-points while creating the path. 

The last three parameters `duration, easing, complete` work the same way as the [jQuery .animate() method](http://api.jquery.com/animate/). You can use custom easing functions by for example including the popular [jQuery Easing Plugin](http://gsgd.co.uk/sandbox/jquery/easing/) in your project. Here's an example using an easing function from the plugin:

	$.fn.scrollPath("scrollTo", "myPath", 1000, "easeInOutSine", function() {
		alert("Animation complete!")
	});

Changelog
---------
__Version 1.1.1 (2012-02-20)__:
Minor bug and performance fixes. Added support for path command chaining.

__Version 1.1 (2012-02-06)__:
Added support for programmatically scrolling/animating to specified points in the path.
