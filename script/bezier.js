// bezier algorithm to integrate into scrollpath later ...
// http://cubic.org/docs/bezier.htm
function linearInterpolation(a, b, t)
{
    return [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t];
}

// evaluate a point on a bezier-curve. t goes from 0 to 1.0
function bezier(a, b, c, d, t)
{
    var ab = linearInterpolation(a,b,t);           // point between a and b (green)
    var bc = linearInterpolation(b,c,t);           // point between b and c (green)
    var cd = linearInterpolation(c,d,t);           // point between c and d (green)
    var abbc = linearInterpolation(ab,bc,t);       // point between ab and bc (blue)
    var bccd = linearInterpolation(bc,cd,t);       // point between bc and cd (blue)
    return linearInterpolation(abbc,bccd,t);   // point on the bezier-curve (black)
}

// small test program.. just prints the points
function drawBezier()
{
    // 4 points define the bezier-curve. These are the points used
    // for the example-images on this page.
    var a = [ 40, 100 ];
    var b = [ 80, 20  ];
    var c = [ 150, 180 ];
    var d = [ 260, 100 ];

    for (var i=0; i<1000; ++i) // 1000 steps
    {
        var t = i/999.0;
        console.log(bezier(a,b,c,d,t));
    }
}
