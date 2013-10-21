


var MESSAGE_PROPERTIES = {
    "pieceId" : "PIECEID",
    "newTop" : "NEWTOP",
    "newLeft" : "NEWLEFT"
};


var readyToPlay = false;
var redplayer = false;
var channel = (Math.round (Math.random()*100000)).toString();
var destination = "/topic/dominoes";

var playPoints, scorePoints;


function setUpMessaging() {
    // construct the WebSocket location
}

function setUpBoneyard() {
	// create the dominoes
    var dominoes = ['db', 'd6', 'd5', 'd4', 'd3', 'd2', 'd1',
                          'b6', 'b5', 'b4', 'b3', 'b2', 'b1',
                                '56', '46', '36', '26', '16',
                                      '45', '35', '25', '15',
                                            '34', '24', '14',
                                                  '23', '13',
                                                        '12', 'back'];
    for (i=0; i < dominoes.length; i++) {
		// 
        d = dominoes[i];
        dburl = "https://dl.dropboxusercontent.com/u/78878172/domis/";
        pic = "<img src='" + dburl + d + ".png'/>";
        // newd = "<div id=" + d + "/>" + pic + "</div>";
        newd = "<div id=" + d + "/>" + "</div>";
		$('div#boneyard').append($(newd).addClass('domino'));
		$('div#'+d).append($(pic));
	}
}


function rotateMe(me) {
    var anyRotation = 'r90 r270 r180',
        po = $(me).position(); // original position
    $me = $(me);
    // starting at left 111, play direction = East
    // if rotation is unreliable on some platforms, could
    // have 4 images per domino, and show only the one in
    // the desired orientation
    if ($me.hasClass('r90')) {
        $me.removeClass(anyRotation);
        console.log("setting 111", $me.data('dx'));
        $me.css('left', '111');
        $me.addClass('r180');
    } else if ($me.hasClass('r180')) {
        $me.removeClass(anyRotation);
        console.log("setting 93", $me.data('dx'));
        $me.css('left', '93');
        $me.addClass('r270');
    } else if ($me.hasClass('r270')) {
        $me.removeClass(anyRotation);
        console.log("setting 111", $me.data('dx'));
        $me.css('left', '111');
    } else {
        // just the first time through here, set original positions.
        // but what about moving while rotated?!?!?
        console.log("setting 93", $me.data('dx'));
        $me.css('left', '93');
        $me.addClass('r90');
    }
    var pr = $me.position(); // rotated position
    $me.data({
            dx: Math.round(pr.left - po.left), // delta X
            dy: Math.round(pr.top - po.top) // delta Y
        });
    console.log("data is: ", $me.data('dx'), $me.data('dy'));
}

$(document).ready(function() {
    setUpBoneyard();
    $('.domino').each(function(index, domino){
        $domino = $(domino);
        // console.log(index, $domino);
        $domino.draggable();
        $domino.dblclick(function() {
            // console.log("double click");
            rotateMe(this);
            console.log("after rotate, position is: ", $(this).position());
            // Read the position
            // var pos = $(this).adjustedPosition();    
            // console.log("adjusted pos is: ", pos);
            // $(this).css(pos);
        });
        $domino.mousedown(function() {
			// console.log("mouse down", $(this).position());
        });
        $domino.mouseup(function() {
			// console.log("mouse up", $(this).position());
        });
    });
});

