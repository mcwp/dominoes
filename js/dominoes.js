/*
Testing too many changes stepwise:
 - look at borders while rotating: as expected.
 - add .bordertest before and after rotations.  As expected.
 - make boneyard with pip values. done.
 - use console to verify pip values. 
 - set #23 in pickDominoes and call sumTips on it. done

 - set #36 next to #23
   - update tips: #23 leftTip, #36 rightTip, #36.addClass('anyTip')
   - call sumTips
 - set #46 next to #36, rotated, and do same tests

 - connect to string and remove draggable?
 - don't worry about all the grids, just the ones that are active 
 because of a Tip.  If a piece is dropped but not connected, highlight
 it differently (blue).  
 - on drop, snap to (virtual) grid
   - then check to see if location validates as an extension of the play (update)
   - or just a random piece dropped in space (highlight temporary outcast?)
 - while dragging, message new lots only
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
        ['36', '3', '6'],   ['26', '2', '6'],   ['16', '1', '6'],   ['45', '4', '5'],
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
    $back.css('top', (8*18).toString());
    $back.css('left', (4*18).toString());
    console.log($back.position());
    // while testing: pick an arbitrary start
    var d23;
    $d23 = $('#23');
    $d23.css('top', (4*18).toString());
    $d23.css('left', (4*18).toString());
    // mark the playable tips
    $d23.addClass('leftTip');
    $d23.addClass('rightTip');
    $d23.addClass('anyTip');
    console.log('sumTips before of #23 only:', sumTips());
}

function getOffsets(d1, d2) {
    var pos1 = d1.position();
    var pos2 = d2.position();
    return {
        'x' : parseInt(pos1.left, 10) - parseInt(pos2.left, 10),
        'y' : parseInt(pos1.top, 10) - parseInt(pos2.top, 10)
    };
}

function getRotation(d) {
    if (d.hasClass('r90')) {
        return 'r90';
    }
    if (d.hasClass('r180')) {
        return 'r180';
    }
    if (d.hasClass('r270')) {
        return 'r270';
    }
    return 'r0';
}

function nearEastTip(tip, d) {
    var pdiff = getOffsets(tip, d),
        dRot = getRotation(d);
    if (pdiff.x>0) {
        // d is not east of this EastTip
        // also true for turning corner
        return false;
    }
    if (Math.abs(pdiff.x) > 80) {
        // lost in space
        // also true for turning a corner
        return false;
    }
    if ((dRot == 'r0') || (dRot == 'r180')) {
        if (Math.abs(pdiff.y) > 10) {
            // d is not in this row
            return false;
        }
        // let's connect
        removeEastTip(tip);
        addEastTip(d);
        return true;
    } else {
        // turning a corner
        // console.log("trying to turn a corner?", pdiff, dRot, tip, d);
        if (Math.abs(pdiff.y) < 10) {
            // adding a SouthTip
            removeEastTip(tip);
            addSouthTip(d);
            return true;
        } else if (pdiff.y < 37) {
            // adding a NorthTip
            removeEastTip(tip);
            addNorthTip(d);
            return true;
        }
        return false;
    }
}

function removeEastTip(tip) {
    var rot = getRotation(tip);
    if (rot == 'r0') {
        primary = 'rightTip';
        secondary = 'leftTip';
    }
    if (rot == 'r180') {
        primary = 'leftTip';
        secondary = 'rightTip';
    }
    // else raise error
    tip.removeClass(primary);
    tip.draggable({ disabled: true });
    if (!tip.hasClass(secondary)) {
        tip.removeClass('anyTip');
    }
}

function addEastTip(tip) {
    var rot = getRotation(tip);
    if (rot == 'r0') {
        tip.addClass('rightTip');
    }
    if (rot == 'r180') {
        tip.addClass('leftTip');
    }
    // else raise error
    tip.addClass('anyTip');
}

function addSouthTip(tip) {
    var rot = getRotation(tip);
    if (rot == 'r90') {
        tip.addClass('rightTip');
    }
    if (rot == 'r270') {
        tip.addClass('leftTip');
    }
    // else raise error
    tip.addClass('anyTip');
}

function addNorthTip(tip) {
    var rot = getRotation(tip);
    if (rot == 'r90') {
        tip.addClass('leftTip');
    }
    if (rot == 'r270') {
        tip.addClass('rightTip');
    }
    // else raise error
    tip.addClass('anyTip');
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

nextRotation = {
    'r0'    : 'r90',
    'r90'   : 'r180',
    'r180'  : 'r270',
    'r270'  : 'r0'
};

function rotateMe(me) {
    var anyRotation = 'r90 r270 r180',
        mySpin, myNext;
    $me = $(me);
    mySpin = getRotation($me);
    myNext = nextRotation[mySpin];
    if (mySpin != 'r0') {
        $me.removeClass(anyRotation);
    }
    if (myNext != 'r0') {
        $me.addClass(myNext);
    }
}


$(document).ready(function() {
    setUpBoneyard();
    pickDominoes();
    $('.domino').each(function(index, domino){
        $domino = $(domino);
        // console.log(index, $domino);
        $domino.draggable({
            grid: [ 18, 18 ]
            // drag: function() { send all or each nth position},        
        });
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
            var $d = $(this);
            $('.anyTip').each(function(index, tip){
                $tip = $(tip);
                if ($tip.attr('id') == $d.attr('id')) {
                    return;
                }
                var rot = getRotation($tip);
                if ((rot == 'r0' && $tip.hasClass('rightTip')) ||
                    (rot == 'r180' && $tip.hasClass('leftTip'))) {
                    if (nearEastTip($tip, $d)) {
                        return;
                    }
                } else {
                    // console.log("not an EastTip");
                }
            });
        });
    });
});

