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

var anyRotation = 'r90 r270 r180';


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

var cardinal = {
    'r0'    : {
        'rightTip'  : 'East',
        'leftTip'   : 'West',
        'doubleTip' : 'North'
    },
    'r90'   : {
        'rightTip'  : 'South',
        'leftTip'   : 'North',
        'doubleTip' : 'East'
    },
    'r180'    : {
        'rightTip'  : 'West',
        'leftTip'   : 'East',
        'doubleTip' : 'South'
    },
    'r270'   : {
        'rightTip'  : 'North',
        'leftTip'   : 'South',
        'doubleTip' : 'West'
    }};

var horizontal = {
    'r0'    : true,
    'r90'   : false,
    'r180'  : true,
    'r270'  : false
};

function horizontalTip(pdiff, dRot, card) {
    // Is the piece close enough to an East or West tip to connect?
    if (horizontal[dRot]) {
        // is it in the same row?
        if (Math.abs(pdiff.y) < 10) {
            return card;
        }
    } else { // vertical
        if (Math.abs(pdiff.y) < 10) {
            // adding a SouthTip
            return 'South';
        } else if ((pdiff.y > 9) && (pdiff.y < 40)) {
            // adding a NorthTip
            return 'North';
        }
    }
    return 'None';
}

function verticalTip(pdiff, dRot, card) {
    // Is the piece close enough to a North or South tip to connect?
    if (!horizontal[dRot]) {
        // is it in the same col?
        if (Math.abs(pdiff.x) < 10) {
            return card;
        }
    } else { // horizontal
        if (Math.abs(pdiff.x) < 10) {
            // adding an EastTip
            return 'East';
        } else if ((pdiff.x > 9) && (pdiff.x < 40)) {
            // adding a WestTip
            return 'West';
        }
    }
    return 'None';
}

function teeDouble(d, card) {
    // since this is a double, play it as a tee
    // card is direction of old tip
    var doubleCard = teePosition[card].r;

    d.addClass('doubleTip');
    d.addClass('anyTip');
    d.removeClass(anyRotation);
    if (doubleCard !== 'r0') {
        d.addClass(doubleCard);
    }
}

function isDouble(d) {
    var l = parseInt(d.attr('lPips'), 10),
        r = parseInt(d.attr('rPips'), 10);
    return (l==r);
}

var teePosition = {
    'East'  : {
        // add x, y and then rotate to vertical
        x : -18,
        y : 0,
        r : 'r90'
    },
    'South' : {
        x : 18,
        y : -81,
        r : 'r180'
    },
    'West'  : {
        x : 36,
        y : 18,
        r : 'r270'
    },
    'North' : {
        x : 18,
        y : 63,
        r : 'r0'
    }
};

function nearTip(tip, rld, d) {
    var pdiff = getOffsets(tip, d),
        dRot = getRotation(d),
        tRot = getRotation(tip);

    var qual1 = {
        'East'  : function(tip, d) {
            // if d is east of tip, x is negative
            // and -80 < x < 0 is not too far east 
            if ((pdiff.x <= 0) && (pdiff.x > -82)) {
                // rest of this is equiv to West, aside from
                // the return of 'East' instead of 'West'
                return horizontalTip(pdiff, dRot, 'East');
            }
            return 'None';
        },
        'South' : function(tip, d) {
            // if d is south of tip, y is negative
            // and -82 < y < 0 is not too far south 
            if ((pdiff.y <= 0) && (pdiff.y > -82)) {
                // rest is equiv to North
                return verticalTip(pdiff, dRot, 'South');
            }
            return 'None';
        },
        'West'  : function(tip, d) {
            // if d is west of tip, x is positive
            // and 80 > x > 0 is not too far west 
            if ((pdiff.x >= 0) && (pdiff.x < 82)) {
                return horizontalTip(pdiff, dRot, 'West');
            }
            return 'None';
        },
        'North' : function(tip, d) {
            // if d is north of tip, y is positive
            // and 82 > y > 0 is not too far north 
            if ((pdiff.y >= 0) && (pdiff.y < 82)) {
                return verticalTip(pdiff, dRot, 'North');
            }
            return 'None';
        },
    };
    // get the cardinal direction of the tip
    var card = cardinal[tRot][rld];
    var newCard = qual1[card](tip, d);
    if (newCard != 'None') {
        removeTip(tip, card);
        if (isDouble(d)) {
            // ignore newCard, doubles are special
            teeDouble(d, card);
        } else {
            addTip(d, newCard);
        }
        return true;
    }
    return false;
}


var whichTips = {
    'r0'    : {
        'East'  : ['rightTip', 'leftTip'],
        'West'  : ['leftTip', 'rightTip']
    },
    'r90'   : {
        'North' : ['leftTip', 'rightTip'],
        'South' : ['rightTip', 'leftTip']
    },
    'r180'  : {
        'West'  : ['rightTip', 'leftTip'],
        'East'  : ['leftTip', 'rightTip']
    },
    'r270'  : {
        'South' : ['leftTip', 'rightTip'],
        'North' : ['rightTip', 'leftTip']
    }
};

function removeTip(tip, card) {
    var rot = getRotation(tip);

    if (tip.hasClass('doubleTip')) {
        tip.removeClass('doubleTip');
        // after extending past the tee, the tips are playable, too
        tip.addClass('leftTip');
        tip.addClass('rightTip');
    } else {
        var wt = whichTips[rot][card];
        tip.removeClass(wt[0]);
        if (!tip.hasClass(wt[1])) {
            tip.removeClass('anyTip');
        }
    }
    tip.draggable({ disabled: true });
}

function addTip(d, newCard) {
    var rot = getRotation(d),
        wt = whichTips[rot][newCard];
    d.addClass(wt[0]);
    d.addClass('anyTip');
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

var nextRotation = {
    'r0'    : 'r90',
    'r90'   : 'r180',
    'r180'  : 'r270',
    'r270'  : 'r0'
};


function rotateMe(me) {
    var mySpin, myNext;

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
            grid: [ 9, 9 ]
            // drag: function() { send all or each nth position},        
        });
        $domino.dblclick(function() {
            // console.log("double click");
            rotateMe(this);
            // console.log("after rotate, position is: ", $(this).position());
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
                    // don't match with myself
                    return;
                }
                var placed = false;
                if ($tip.hasClass('doubleTip')) {
                    placed = nearTip($tip, 'doubleTip', $d);
                    // mutually exclusive with right and left
                    return !placed;
                }
                if ($tip.hasClass('rightTip')) {
                    placed = nearTip($tip, 'rightTip', $d);
                }
                if ($tip.hasClass('leftTip')) {
                    // the first piece played will have both r & l tips
                    // likewise a double after both long edges are played
                    placed = nearTip($tip, 'leftTip', $d) || placed;
                }
                // if placed, return false to stop .each() loop
                return !placed;
            });
        });
    });
});

