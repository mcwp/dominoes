/*
Testing too many changes stepwise:
 - look at borders while rotating: as expected.
 - add .bordertest before and after rotations.  As expected.
 - make boneyard with pip values. done.
 - use console to verify pip values. 
 - set $23 in pickDominoes and call sumTips on it. done

 - set $36 next to $23
   - update tips: $23 leftTip, $36 rightTip, $36.addClass('anyTip')
   - call sumTips
 - set $46 next to $36, rotated, and do same tests

*/


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
    var dominoes1 = ['db', 'd6', 'd5', 'd4', 'd3', 'd2', 'd1',
                          'b6', 'b5', 'b4', 'b3', 'b2', 'b1',
                                '56', '46', '36', '26', '16',
                                      '45', '35', '25', '15',
                                            '34', '24', '14',
                                                  '23', '13',
                                                        '12', 'back'];
    var dominoes = [['db', '0', '0'],   ['d6', '6', '6'],   ['d5', '5', '5'],
        ['d4', '4', '4'],   ['d3', '3', '3'],   ['d2', '2', '2'],   ['d1', '1', '1'],
        ['b6', '0', '6'],   ['b5', '0', '5'],   ['b4', '0', '4'],   ['b3', '0', '3'],
        ['b2', '0', '2'],   ['b1', '0', '1'],   ['56', '5', '6'],   ['46', '4', '6'],
        ['36', '3', '4'],   ['26', '2', '6'],   ['16', '1', '6'],   ['45', '4', '5'],
        ['35', '3', '5'],   ['25', '2', '5'],   ['15', '1', '5'],   ['34', '3', '4'],
        ['24', '2', '4'],   ['14', '1', '4'],   ['23', '2', '3'],   ['13', '1', '3'],
        ['12', '1', '2'],   ['back', '0', '0'] ];

    for (i=0; i < dominoes.length; i++) {
		// 
        var d = dominoes[i][0];

        var dburl = "https://dl.dropboxusercontent.com/u/78878172/domis/";
        var pic = "<img src='" + dburl + d + ".png'/>";
        // newd = "<div id=" + d + "/>" + pic + "</div>";
        var newd = "<div id=" + d + "/>" + "</div>";
		$('div#boneyard').append($(newd).addClass('domino'));
        var newDomi = $('div#'+d);
		// $('div#'+d).append($(pic));
        $(newDomi).append($(pic));
        $(newDomi).attr('lPips', dominoes[i][1]);
        $(newDomi).attr('rPips', dominoes[i][2]);
	}
}

function pickDominoes() {
	// seven to each player (just 2 players for now)
	var back;
    // while testing: just move back out of the way
	$back = $('#back');
	$back.css('top', '74');
	$back.css('left', '74');
	console.log($back.position());
    // while testing: pick an arbitrary start
    var d23;
    $d23 = $('#23');
    $d23.css('top', '111');
    $d23.css('left', '111');
    // test: see that border rotates with piece
    // $d23.addClass('bordertest');
    // mark the playable tips
    $d23.addClass('leftTip');
    $d23.addClass('rightTip');
    $d23.addClass('anyTip');
}

function sumTips() {
    var score = 0;
    $('.anyTip').each(function(index, domino){
        $domino = $(domino);
        if ($domino.hasClass('leftTip')) {
            score += parseInt($domino.attr('lPips'), 10);
        }
        if ($domino.hasClass('rightTip')) {
            score += parseInt($domino.attr('rPips'), 10);
        }
    });
    return score;
}

function rotateMe(me) {
    var anyRotation = 'r90 r270 r180',
        po = $(me).position(); // original position
    $me = $(me);
    // set the desired position before rotation, since 
    // setting it after is ignored in some rotations
    if ($me.hasClass('r90')) {
        $me.removeClass(anyRotation);
        // console.log("setting 111", $me.data('dx'));
        // $me.css('left', '111');
        $me.addClass('r180');
    } else if ($me.hasClass('r180')) {
        $me.removeClass(anyRotation);
        // console.log("setting 93", $me.data('dx'));
        // $me.css('left', '93');
        $me.addClass('r270');
    } else if ($me.hasClass('r270')) {
        $me.removeClass(anyRotation);
        // console.log("setting 111", $me.data('dx'));
        // $me.css('left', '111');
    } else {
        // console.log("setting 93", $me.data('dx'));
        // $me.css('left', '93');
        $me.addClass('r90');
    }
    var pr = $me.position(); // rotated position
    $me.data({
            dx: Math.round(pr.left - po.left), // delta X
            dy: Math.round(pr.top - po.top) // delta Y
        });
    console.log("offset data is: ", $me.data('dx'), $me.data('dy'));
}

$(document).ready(function() {
    setUpBoneyard();
    pickDominoes();
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

