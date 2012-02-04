$(document).ready(init);

function init() {
	/* ========== DRAWING THE PATH AND INITIATING THE PLUGIN ============= */

	var path = $.fn.scrollPath("getPath");
	// Move to .demo
	path.moveTo(400, 50);
	// Line to .description
	path.lineTo(400, 800);
	// Arc down and line to .syntax
	path.arc(200, 1200, 400, -Math.PI/2, Math.PI/2, true);
	path.lineTo(600, 1600, {callback: function() {
			highlight($(".settings"));
		}
	});
	// Continue line to .scrollbar
	path.lineTo(1750, 1600, {callback: function() {
			highlight($(".sp-scroll-handle"));
		}
	});
	// Arc up while rotating
	path.arc(1800, 1000, 600, Math.PI/2, 0, true, {rotate: Math.PI/2 });
	// Line to .rotations
	path.lineTo(2400, 750);
	// Rotate in place
	path.rotate(3*Math.PI/2);
	// Continue upwards to .source
	path.lineTo(2400, -700);
	// Small arc downwards
	path.arc(2250, -700, 150, 0, -Math.PI/2, true);

	//Line to .follow
	path.lineTo(1350, -850);
	// Arc and rotate back to the beginning.
	path.arc(1300, 50, 900, -Math.PI/2, -Math.PI, true, {rotate: Math.PI*2});

	// We're done with the path, initate the plugin on our wrapper element
	$(".wrapper").scrollPath({drawPath: true, wrapAround: true});

	/* ===================================================================== */

	$(".settings .show-path").click(function(e) {
		e.preventDefault();
		$(".sp-canvas").toggle();
	}).toggle(function() {
		$(this).text("Hide Path");
	}, function() {
		$(this).text("Show Path");
	});

	$(".tweet").click(function(e) {
		open(this.href, "", "width=550, height=450");
		e.preventDefault();
	});

	$.getJSON("http://cdn.api.twitter.com/1/urls/count.json?callback=?&url=http%3A%2F%2Fjoelb.me%2Fscrollpath",
			function(data) {
				if(data && data.count !== undefined) {
					$(".follow .count").html("the " + ordinal(data.count + 1) + " kind person to");
				}
			});
	}


function highlight(element) {
	if(!element.hasClass("highlight")) {
		element.addClass("highlight");
		setTimeout(function() { element.removeClass("highlight"); }, 2000);
	}
}
function ordinal(num) {
	return num + (
		(num % 10 == 1 && num % 100 != 11) ? 'st' :
		(num % 10 == 2 && num % 100 != 12) ? 'nd' :
		(num % 10 == 3 && num % 100 != 13) ? 'rd' : 'th'
	);
}
