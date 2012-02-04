/*
                =============================
                  jQuery Scroll Path Plugin
                            v1.0

                   Demo and Documentation:
                  http://joelb.me/scrollpath
                =============================

    A jQuery plugin for defining a custom path that the browser
    follows when scrolling. Comes with a custom scrollbar,
    which is styled in scrollpath.css.

    Author: Joel Besada (http://www.joelb.me)
    Date: 2012-02-01

    Copyright 2012, Joel Besada
    MIT Licensed (http://www.opensource.org/licenses/mit-license.php)
*/

( function ( $, window, document, undefined ) {
	var	PREFIX =  "-" + getVendorPrefix().toLowerCase() + "-",
		HAS_TRANSFORM_SUPPORT = supportsTransforms(),
		HAS_CANVAS_SUPPORT = supportsCanvas(),
		isInitiated = false,
		isDragging = false,
		step = 0,
		pathObject,
		pathList,
		element,
		scrollBar,
		scrollHandle,

		// Default speeds for scrolling and rotating (with path.rotate())
		speeds = {
			scrollSpeed: 50,
			rotationSpeed: Math.PI/15
		},

		// Default plugin settings
		settings = {
			wrapAround: false,
			drawPath: false,
			scrollBar: true
		},

		methods = {
			/* Initates the plugin */
			init: function( options ) {
				if ( this.length > 1 || isInitiated ) $.error( "jQuery.scrollPath can only initialized on *one* element *once*" );
				
				$.extend( settings, options );
				isInitiated = true;
				element = this;
				pathList = pathObject.getPath();
				initCanvas();
				initScrollBar();
				scrollToStep( 0 ); // Go to the first step immediately
				element.css( "position", "relative" );

				$( document ).on({
					"mousewheel": scrollHandler,
					"DOMMouseScroll": scrollHandler, // Firefox
					"keydown": keyHandler
				});

				$( window ).on( "resize", function() { scrollToStep( step ); } ); // Re-centers the screen
				return this;
			},

			getPath: function( options ) {
				$.extend( speeds, options );
				return pathObject || ( pathObject = new Path( speeds.scrollSpeed, speeds.rotationSpeed ));
			}
		};
	
	/* The Path object serves as a context to "draw" the scroll path
		on before initating the plugin */
	function Path( scrollS, rotateS ) {
		var PADDING = 40,
			scrollSpeed = scrollS,
			rotationSpeed = rotateS,
			xPos = 0,
			yPos = 0,
			rotation = 0,
			width = 0,
			height = 0,
			offsetX = 0,
			offsetY = 0,
			canvasPath = [{ method: "moveTo", args: [ 0, 0 ] }], // Needed if first path operation isn't a moveTo
			path = [],

			defaults = {
				rotate: null,
				callback: null
			};

		/* Rotates the screen while staying in place */
		this.rotate = function( radians, options ) {
			if ( !HAS_TRANSFORM_SUPPORT ) return;

			var settings = $.extend( {}, defaults, options ),
				rotDistance = Math.abs( radians - rotation ),
				steps = Math.round( rotDistance / rotationSpeed ),
				rotStep = ( radians - rotation ) / steps,
				i = 1;
			
			
			for( ; i <= steps; i++ ) {
				path.push({ x: xPos,
							y: yPos,
							rotate: rotation + rotStep * i,
							callback: i === steps ? settings.callback : null
						});
			}
			
			rotation = radians % ( Math.PI*2 );
		};

		/* Moves (jumps) directly to the given point */
		this.moveTo = function( x, y, options ) {
			var settings = $.extend( {}, defaults, options );

			path.push({ x: x,
						y: y,
						rotate: settings.rotate !== null ? settings.rotate : rotation,
						callback: settings.callback
					});

			setPos( x, y );

			updateCanvas( x, y );
			canvasPath.push({ method: "moveTo", args: arguments });
		};

		/* Draws a straight path to the given point */
		this.lineTo = function( x, y, options ) {
			var settings = $.extend( {}, defaults, options ),
				relX = x - xPos,
				relY = y - yPos,
				distance = hypotenuse( relX, relY ),
				steps = Math.round( distance/scrollSpeed ),
				xStep = relX / steps,
				yStep =  relY / steps,
				canRotate = settings.rotate !== null && HAS_TRANSFORM_SUPPORT,
				rotStep = ( canRotate ? ( settings.rotate - rotation ) / steps : 0 ),
				i = 1;

			for ( ; i <= steps; i++ ) {
				path.push({ x: xPos + xStep * i,
							y: yPos + yStep * i,
							rotate: rotation + rotStep * i,
							callback: i === steps ? settings.callback : null
						});
			}

			rotation = ( canRotate ? settings.rotate : rotation );
			setPos( x, y );

			updateCanvas( x, y );
			canvasPath.push({ method: "lineTo", args: arguments });
		};

		/* Draws an arced path with a given circle center, radius, start and end angle. */
		this.arc = function( centerX, centerY, radius, startAngle, endAngle, counterclockwise, options ) {
			var settings = $.extend( {}, defaults, options ),
				startX = centerX + Math.cos( startAngle ) * radius,
				startY = centerY + Math.sin( startAngle ) * radius,
				endX = centerX + Math.cos( endAngle ) * radius,
				endY = centerY + Math.sin( endAngle ) * radius,
				angleDistance = sectorAngle( startAngle, endAngle, counterclockwise ),
				distance = radius * angleDistance,
				steps = Math.round( distance/scrollSpeed ),
				radStep = angleDistance / steps * ( counterclockwise ? -1 : 1 ),
				canRotate = settings.rotate !== null && HAS_TRANSFORM_SUPPORT,
				rotStep = ( canRotate ? (settings.rotate - rotation) / steps : 0 ),
				i = 1;

			// If the arc starting point isn't the same as the end point of the preceding path,
			// prepend a line to the starting point. This is the default behavior when drawing on
			// a canvas.
			if ( xPos !== startX || yPos !== startY ) {
				this.lineTo( startX, startY );
			}
			
			for ( ; i <= steps; i++ ) {
				path.push({ x: centerX + radius * Math.cos( startAngle + radStep*i ),
							y: centerY + radius * Math.sin( startAngle + radStep*i ),
							rotate: rotation + rotStep * i,
							callback: i === steps ? settings.callback : null
						});
			}

			rotation = ( canRotate ? settings.rotate : rotation );
			setPos( endX, endY );

			updateCanvas( centerX + radius, centerY + radius );
			updateCanvas( centerX - radius, centerY - radius );
			canvasPath.push({ method: "arc", args: arguments });
		};

		this.getPath = function() {
			return path;
		};

		/* Appends offsets to all x and y coordinates before returning the canvas path */
		this.getCanvasPath = function() {
			var i = 0;
			for( ; i < canvasPath.length; i++ ) {
				canvasPath[ i ].args[ 0 ] -= this.getPathOffsetX();
				canvasPath[ i ].args[ 1 ] -= this.getPathOffsetY();
			}
			return canvasPath;
		};

		this.getPathWidth = function() {
			return width - offsetX + PADDING;
		};

		this.getPathHeight = function() {
			return height - offsetY + PADDING;
		};

		this.getPathOffsetX = function() {
			return offsetX - PADDING / 2;
		};

		this.getPathOffsetY = function() {
			return offsetY - PADDING / 2;
		};

		/* Sets the current position */
		function setPos( x, y ) {
			xPos = x;
			yPos = y;
		}

		/* Updates width and height, if needed */
		function updateCanvas( x, y ) {
			offsetX = Math.min( x, offsetX );
			offsetY = Math.min( y, offsetY );
			width = Math.max( x, width );
			height = Math.max( y, height );
		}

	}

	/* Plugin wrapper, handles method calling */
	$.fn.scrollPath = function( method ) {
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
		} else if ( typeof method === "object" || !method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( "Method " +  method + " does not exist on jQuery.scrollPath" );
		}
	};

	/* Initalize the scroll bar */
	function initScrollBar() {
		if ( !settings.scrollBar ) return;

		scrollBar = $( "<div>" ).
						addClass( "sp-scroll-bar" ).
						on( "click", function( e ) {
							var clickStep = Math.round( e.offsetY / scrollBar.height() * ( pathList.length - 1) );

							// Close in on the clicked part instead of jumping directly to it.
							// This mimics the default browser scroll bar behavior.
							if ( Math.abs(clickStep - step) > 5 ) {
								clickStep = step + ( 5 * ( clickStep > step ? 1 : -1 ) );
							}
							scrollToStep(clickStep);

							e.preventDefault();
							return false;
						});
		
		scrollHandle = $( "<div>" ).
							addClass( "sp-scroll-handle" ).
							on({
								click: function( e ) {
									e.preventDefault();
									return false;
								},
								mousedown: function( e ) {
									isDragging = true;
									e.preventDefault();
									return false;
								}
							});
		$( document ).on({
			mouseup: function( e ) { isDragging = false;  },
			mousemove: function( e ) {  if( isDragging ) dragScrollHandler( e ); }
		});

		$( "body" ).prepend( scrollBar.append( scrollHandle ) );
		
	}

	/* Initializes the path canvas */
	function initCanvas() {
		if ( !settings.drawPath || !HAS_CANVAS_SUPPORT ) return;

		var canvas,
			style = {
				position: "absolute",
				"z-index": 9998,
				left: pathObject.getPathOffsetX(),
				top: pathObject.getPathOffsetY(),
				"pointer-events": "none"
			};
		
		applyPrefix( style, "user-select", "none" );
		applyPrefix( style, "user-drag", "none" );
		
		canvas = $( "<canvas>" ).
					addClass( "sp-canvas" ).
					css( style ).
					prependTo( element );
		
		canvas[ 0 ].width = pathObject.getPathWidth();
		canvas[ 0 ].height = pathObject.getPathHeight();
		
		drawCanvasPath( canvas[ 0 ].getContext( "2d" ), pathObject.getCanvasPath() );
	}

	/* Sets the canvas path styles and draws the path */
	function drawCanvasPath( context, path ) {
		var i = 0;

		context.shadowBlur = 15;
		context.shadowColor = "black";
		context.strokeStyle = "white";
		context.lineJoin = "round";
		context.lineCap = "round";
		context.lineWidth = 10;

		for( ; i < path.length; i++ ) {
			context[ path[ i ].method ].apply( context, path[ i ].args );
		}

		context.stroke();
	}

	/* Handles mousewheel scrolling */
	function scrollHandler( e ) {
		var scrollDelta = e.originalEvent.wheelDelta || -e.originalEvent.detail,
			dir = scrollDelta / ( Math.abs( scrollDelta ) );

		e.preventDefault();
		$( window ).scrollTop( 0 ).scrollLeft( 0 );
		scrollSteps( -dir );
	}

	/* Handles key scrolling (arrows and space) */
	function keyHandler( e ) {
		// Disable scrolling with keys when user has focus on text input elements
		if ( /^text/.test( e.target.type ) ) return;
		switch ( e.keyCode ) {
			case 40: // Down Arrow
				scrollSteps( 1 );
				break;
			case 38: // Up Arrow
				scrollSteps( -1 );
				break;
			case 32: // Spacebar
				scrollSteps( 5 * ( e.shiftKey ? -1 : 1 ) );
				break;
		}
	}

	/* Handles scrollbar scrolling */
	function dragScrollHandler( e ) {
		var dragStep,
			y = e.clientY - scrollBar.offset().top;

		dragStep = limitWithin( Math.round( y / scrollBar.height() * ( pathList.length - 1 ) ), 0, pathList.length - 1 );

		scrollToStep( dragStep );
	}

	/* Scrolls forward the given amount of steps. Negative values scroll backward. */
	function scrollSteps( steps ) {
		var nextStep = step + steps;

		if ( settings.wrapAround ) {
			while ( nextStep < 0 ) nextStep += pathList.length;
			while ( nextStep >= pathList.length ) nextStep -= pathList.length;
		} else {
			nextStep = limitWithin( nextStep, 0, pathList.length - 1 );
		}

		scrollToStep( nextStep );
	}

	/* Scrolls to a specified step */
	function scrollToStep( stepParam ) {
		var cb = pathList[ stepParam ].callback;

		element.css( makeCSS( pathList[ stepParam ] ) );
		if( scrollHandle ) scrollHandle.css( "top", stepParam / (pathList.length - 1 ) * ( scrollBar.height() - scrollHandle.height() ) + "px" );
		if ( cb && stepParam !== step ) cb();
		step = stepParam;
	}

	/* Translates a given node in the path to CSS styles */
	function makeCSS( node ) {
		var centeredX = node.x - $( window ).width() / 2,
			centeredY = node.y - $( window ).height() / 2,
			style = {};
		
		// Only use transforms when page is rotated
		if ( normalizeAngle(node.rotate) === 0 ) {
			style.left = -centeredX;
			style.top = -centeredY;
			applyPrefix( style, "transform-origin", "" );
			applyPrefix( style, "transform", "" );
		} else {
			style.left = style.top = "";
			applyPrefix( style, "transform-origin",  node.x + "px " + node.y + "px" );
			applyPrefix( style, "transform", "translate(" + -centeredX + "px, " + -centeredY + "px) rotate(" + node.rotate + "rad)" );
		}

		return style;
	}

	/* Determine the vendor prefix of the visitor's browser,
		http://lea.verou.me/2009/02/find-the-vendor-prefix-of-the-current-browser/
	*/
	function getVendorPrefix() {
		var regex = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,
			someScript = document.getElementsByTagName( "script" )[ 0 ];

		for ( var prop in someScript.style ) {
			if ( regex.test(prop) ) {
				return prop.match( regex )[ 0 ];
			}
		}

		if ( "WebkitOpacity" in someScript.style ) return "Webkit";
		if ( "KhtmlOpacity" in someScript.style ) return "Khtml";

		return "";
	}

	/* Applied prefixed and unprefixed css values of a given property to a given object*/
	function applyPrefix( style, prop, value ) {
		style[ PREFIX + prop ] = style[ prop ] = value;
	}

	/* Limits a given value between a lower and upper limit */
	function limitWithin( value, lowerLimit, upperLimit ) {
		if ( value > upperLimit ) {
			return upperLimit;
		} else if ( value < lowerLimit ) {
			return lowerLimit;
		}
		return value;
	}

	/* Checks for CSS transform support */
	function supportsTransforms() {
		var	testStyle =  document.createElement( "dummy" ).style,
			testProps = [ "transform",
						"WebkitTransform",
						"MozTransform",
						"OTransform",
						"msTransform",
						"KhtmlTransform" ],
			i = 0;

		for ( ; i < testProps.length; i++ ) {
			if ( testStyle[testProps[ i ]] !== undefined ) {
				return true;
			}
		}
		return false;
	}

	/* Checks for canvas support */
	function supportsCanvas() {
		return !!document.createElement( "canvas" ).getContext;
	}

	/* Calculates the angle distance between two angles */
	function sectorAngle( start, end, ccw ) {
		var nStart = normalizeAngle( start ),
			nEnd = normalizeAngle( end ),
			diff = Math.abs( nStart - nEnd ),
			invDiff = Math.PI * 2 - diff;
		
		if ( ( ccw && nStart < nEnd ) ||
			( !ccw && nStart > nEnd ) ||
			( nStart === nEnd && start !== end ) // Special case *
		) {
				return invDiff;
		}

		// *: In the case of a full circle, say from 0 to 2 * Math.PI (0 to 360 degrees),
		// the normalized angles would be the same, which means the sector angle is 0.
		// To allow full circles, we set this special case.

		return diff;
	}
	
	/* Normalizes a given angle (sets it between 0 and 2 * Math.PI) */
	function normalizeAngle( angle ) {
		while( angle < 0 ) {
			angle += Math.PI * 2;
		}
		return angle % ( Math.PI * 2 );
	}

	/* Calculates the hypotenuse of a right triangle with sides x and y */
	function hypotenuse( x, y ) {
		return Math.sqrt( x * x + y * y );
	}

})( jQuery, window, document );
