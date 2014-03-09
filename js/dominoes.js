/*
possible options:
 - remove draggable when inner attached
 - reset draggable when undoing moves

TBD:
randomize boneyard
use message types for different operations? 
    just move - no class changes
    just rotate - no moving
    attach and add tips
    remove tips 
    update opponent's score

Bugs (some amusing):
 - need to terminate messaging somehow
 - moving opponent's domino adds name and reveal
 - 

websocket mods:
 - should some or all of these messages be transactions instead?
*/


var MESSAGE_PROPERTIES = {
    "dominoId"  : "DOMINOID",
    "newTop"    : "NEWTOP",
    "newLeft"   : "NEWLEFT",
    "setClass"  : "SETCLASS",
    "myScore"   : "MYSCORE",
    "tipSum"    : "TIPSUM",
    "playerName": "PLAYERNAME"
};


var readyToPlay = false;
// var channel = (Math.round (Math.random()*100000)).toString();
// var channel = 905120;
// having switched from topics to queues, need to have a queue for
// each player!  else the echo eats the message sometimes and the 
// other player never gets it.  but... how to make the connection then?
// go back to topics maybe.  or complimentary produce/consume on 905 and 120
var destination = "/queue/domi";
var unsentMessages = [];
var newMessageData;
var scoreForPlayer, scorePlayerName;
var unselectedPlayer, unselectedButton, otherScore;

var anyRotation = 'r90 r270 r180';

var setUpPlayers = function (url) {
    var qs = url.split('?')[1],
        pairs,
        params = {};

    if (qs) {
        pairs = qs.split('&');
        pairs.forEach(function (pair) {
            pair = pair.split('=');
            params[pair[0]] = decodeURIComponent(pair[1] || '');
        });
    }
    var playerA = params.a || "Sara";
    var playerB = params.b || "Marla";
    channel = params.c || 905120;
    $('.playerA').text(playerA);
    $('.playerB').text(playerB);
};

var setUpMessaging = function () {
    // construct the WebSocket location
    var locationURI = new URI(document.URL || location.href);

    locationURI.scheme = locationURI.scheme.replace("http", "ws");
    locationURI.path = "/jms";
    delete locationURI.query;
    delete locationURI.fragment;
    // default the location
    var url = locationURI.toString();
    destination = destination + channel;
    myQ = destination + selectedPlayer;
    yourQ = destination + unselectedPlayer;
    ccps.startConnection(url, myQ, yourQ, init, MESSAGE_PROPERTIES, acceptMove);
};

var init = function () {
    var d1 = $('#d1');
    d1.css('top', '54px');
    // d1.append($('<p class="flip">' + scorePlayerName + '</p>'));
};

var revealFront = function (d) {
    var myimg = $(d.children()[0]);
    myimg.attr('src', myimg.attr('front'));
};

var piecePlayed = function (oldClasses, newClasses) {
    return ((oldClasses.search('Tip') === -1) && (newClasses.search('Tip') !== -1));
};

var acceptMove = function (messageData) {
    var d = $(document.getElementById(messageData.dominoId)),
        top = messageData.newTop,
        left = messageData.newLeft,
        playerName = messageData.playerName;

    console.log("accepting move... ", messageData.dominoId);
    if (playerName !== "") {
        // only sent from the first mouseUp, which
        // flips the domino for the other player
        d.append($('<p class="flip">' + playerName + '</p>'));
    }
    if (piecePlayed(d.attr('class'), messageData.setClass)) {
        // now reveal this domino
        flip = $(d.children()[1]);
        flip.remove();
        revealFront(d);
    }
    d.css('top', top);
    d.css('left', left);
    if (messageData.setClass !== "") {
        d.removeClass();
        d.attr('class', messageData.setClass);
        console.log("set to", d.attr('class'));
    }
    // if (d.hasClass('veryFirst')) {
    //     $('.startBox').hide();
    // }

    // update the tipSum and other player's score
    $('.tipSum').text(messageData.tipSum);
    otherScore.text(messageData.myScore);
};


var messageDominoData = function (d, playerName, msgTxt, required) {
    // console.log('placed or untipped domino ');
    newMessageData = {};
    newMessageData.dominoId = d[0].id;
    newMessageData.newTop = d.css('top');
    newMessageData.newLeft = d.css('left');
    newMessageData.setClass = d.attr('class');
    var ms = scoreForPlayer.text();
    newMessageData.myScore = ms;
    var ts = $('.tipSum').text();
    newMessageData.tipSum = ts;
    // console.log("ms, ts", ms, ts);
    // console.log("sending message for ", d[0].id, " with class: ", newMessageData.setClass);
    newMessageData.playerName = playerName;
    console.log("sending msg play for " + newMessageData.dominoId);

    // console.log("sending ...");
    // console.log($piece);
    // console.log(newMessageData);
    if (!ccps.sendMessagePlay(newMessageData, msgTxt) && required) {
        unsentMessages.push(newMessageData);
    }
};

var setUpBoneyard = function () {
    // create the dominoes
    var dominoes = [['db', '0', '0'],   ['d6', '6', '6'],   ['d5', '5', '5'],
        ['d4', '4', '4'],   ['d3', '3', '3'],   ['d2', '2', '2'],   ['d1', '1', '1'],
        ['b6', '0', '6'],   ['b5', '0', '5'],   ['b4', '0', '4'],   ['b3', '0', '3'],
        ['b2', '0', '2'],   ['b1', '0', '1'],   ['56', '5', '6'],   ['46', '4', '6'],
        ['36', '3', '6'],   ['26', '2', '6'],   ['16', '1', '6'],   ['45', '4', '5'],
        ['35', '3', '5'],   ['25', '2', '5'],   ['15', '1', '5'],   ['34', '3', '4'],
        ['24', '2', '4'],   ['14', '1', '4'],   ['23', '2', '3'],   ['13', '1', '3'],
        ['12', '1', '2'], ];

    var backimg = '<img src="https://dl.dropboxusercontent.com/u/78878172/domis/back.png"/>';
    for (i=0; i < dominoes.length; i++) {
        // 
        var d = dominoes[i][0];

        var dburl = "https://dl.dropboxusercontent.com/u/78878172/domis/";
        var pic = dburl + d + ".png";
        var newd = "<div id=" + d + "/>" + "</div>";
        $('div#boneyard').append($(newd).addClass('domino'));
        var newDomi = $('div#'+d);
        $(newDomi).append($(backimg).attr('front', pic));
        $(newDomi).attr('lPips', dominoes[i][1]);
        $(newDomi).attr('rPips', dominoes[i][2]);
        var pos = {
            top: ((i%3)*9).toString(),
            left: ((i%3)*9).toString()
        };
        $(newDomi).css(pos);
    }
    $('#boneyard').hide();
};

var setFirstDomino = function (d) {
    if (isDouble(d)) {
        d.addClass('doubleTip');
    } else {
        d.addClass('leftTip');
        d.addClass('rightTip');
    }
    d.addClass('anyTip');
    d.addClass('veryFirst');
    sumTips();
    messageDominoData(d, "", "set first domino", true);
};


var getOffsets = function (d1, d2) {
    var pos1 = d1.position();
    var pos2 = d2.position();
    // console.log(pos1, pos2);
    return {
        'x' : parseInt(pos1.left, 10) - parseInt(pos2.left, 10),
        'y' : parseInt(pos1.top, 10) - parseInt(pos2.top, 10)
    };
};

var getRotation = function (d) {
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
};

var teeRotation = {
    'East'  : {
        r : 'r90'
    },
    'South' : {
        r : 'r180'
    },
    'West'  : {
        r : 'r270'
    },
    'North' : {
        r : 'r0'
    }
};


var cardinal = {
    'r0'    : {
        'rightTip'  : 'East',
        'leftTip'   : 'West',
        'doubleTip' : 'North',
        'veryFirst' : 'South'
    },
    'r90'   : {
        'rightTip'  : 'South',
        'leftTip'   : 'North',
        'doubleTip' : 'East',
        'veryFirst' : 'West'
    },
    'r180'    : {
        'rightTip'  : 'West',
        'leftTip'   : 'East',
        'doubleTip' : 'South',
        'veryFirst' : 'North'
    },
    'r270'   : {
        'rightTip'  : 'North',
        'leftTip'   : 'South',
        'doubleTip' : 'West',
        'veryFirst' : 'East'
    }
};


var targetSpots = {
    'East'  : {
        'North' : {y: -36, x: 72},
        'East'  : {y: 0, x: 72},
        'South' : {y: 0, x: 72},
    //  'West'  : {y: 0, x: 36},
        'tee'   : {y: -18, x: 72},
        'unTee' : {y: 18, x: 36}
    },
    'South' : {
    //  'North' : {y: -36, x: 0},
        'East'  : {y: 72, x: 0},
        'South' : {y: 72, x: 0},
        'West'  : {y: 72, x: -36},
        'tee'   : {y: 72, x: -18},
        'unTee' : {y: 36, x: 18}
    },
    'West'  : {
        'North' : {y: -36, x: -36},
    //  'East'  : {y: 0, x: -36},
        'South' : {y: 0, x: -36},
        'West'  : {y: 0, x: -72},
        'tee'   : {y: -18, x: -36},
        'unTee' : {y: 18, x: -72}
    },
    'North'  : {
        'North' : {y: -72, x: 0},
        'East'  : {y: -36, x: 0},
    //  'South' : {y: -36, x: 0},
        'West'  : {y: -36, x: -36},
        'tee'   : {y: -36, x: -18},
        'unTee' : {y: -72, x: 18}
    }
};

var closeByTen = function (point, target) {
    var lt = target-10,
        gt = target+10;
    return (lt <= point && point <= gt);
};


var matchTarget = function (card, pDiffs, target) {
    // should/could handle pip matching here, too?
    if (closeByTen(pDiffs.y, targetSpots[card][target].y) &&
        closeByTen(pDiffs.x, targetSpots[card][target].x)) {
        return target;
    }
    return 'None';
};

var nearTip = function (tip, rld, d) {
    // return true if piece is placed
    var pDiffs = getOffsets(d, tip),
        dRot = getRotation(d),
        tRot = getRotation(tip),
        opposite = 'None',
        veryFirst = tip.hasClass('veryFirst'),
        card = cardinal[tRot][rld];

    newCard = 'None';
    dDouble = isDouble(d);
    if (horizontal[tRot] == horizontal[dRot]) {
        // try to continue in same direction
        if (dDouble || (rld == 'doubleTip')) {
            // give up.  Any double means they should be
            // orthoganal, not aligned
            return false;
        }
        newCard = matchTarget(card, pDiffs, card);
    // else know they are orthoganal, not aligned
    } else if (rld == 'doubleTip') {
            newCard = matchTarget(card, pDiffs, 'unTee');
            if (veryFirst && (newCard == 'None')) {
                opposite = cardinal[tRot]['veryFirst'];
                newCard = matchTarget(opposite, pDiffs, 'unTee');
            }
    } else if (dDouble) {
            newCard = matchTarget(card, pDiffs, 'tee');
    } else {
        $.each(targetSpots[card], function(key) {
            if (key == card || key == 'tee' || key == 'unTee') {
                // skip, continue inner .each
                return true;
            } else {
                newCard = matchTarget(card, pDiffs, key);
                // is this scoped to the inner .each?  will it
                // set the newCard in the scope of nearTip?
                // if not, need an alternative method here...
            }
            return (newCard == 'None');
            // return true == continue looping inner .each
        });
    }
    // console.log("newCard is ", newCard);
    if (newCard != 'None') {
        if (newCard == 'tee') {
            // doubles are special
            tPips = getPips(tip, card, 0);
            dPips = getPips(d, newCard, 1);
            // console.log("pips:", tPips, dPips);
            if (tPips != dPips) {
                return false;
            }
            teeDouble(d, card);
            // messages sent before the call to removeTip
        } else if (newCard == 'unTee') {
            // as are unTees, after a double
            tPips = getPips(tip, 'tee', 0);
            dPips = getPips(d, card, 1);
            // two special cases: veryFirst(1) and opposite(1/0)
            // console.log("pips:", tPips, dPips);
            if (tPips != dPips) {
                if (opposite != 'None') {
                    dPips = getPips(d, opposite, 1);
                    if (tPips != dPips) {
                        return false;
                    } else {
                        card = opposite;
                        // no need to rotate
                    }
                } else {
                    return false;
                }
            } else if (veryFirst) {
                // not anymore, spin around
                teeDouble(tip, cardinal[tRot]['veryFirst']);
                tip.removeClass('veryFirst');
                messageDominoData(tip, "", "no longer veryFirst, spun", true);
                // avoid removing the doubleTip too early
                return true;
            }
            addTip(d, card);
            if (card == opposite) {
                tip.removeClass('veryFirst');
                messageDominoData(tip, "", "not first anymore", true);
                // avoid removing the doubleTip too early
                return true;
            }
        } else {
            tPips = getPips(tip, card, 0);
            dPips = getPips(d, newCard, 1);
            // console.log("pips:", tPips, dPips);
            if (tPips != dPips) {
                return false;
            }
            addTip(d, newCard);
        }
        removeTip(tip, card);
        messageDominoData(tip, "", "ordinary old tip", true);
        return true;
    }
    return false;
};

var getPips = function (domino, card, i) {
    if (card == 'tee') {
        // domino is double, either end works
        return pips(domino, 'lPips');
    } else if (whichTips[getRotation(domino)][card][i] == 'leftTip') {
        return pips(domino, 'lPips');
    } else {
        return pips(domino, 'rPips');
    }
};


var horizontal = {
    'r0'    : true,
    'r90'   : false,
    'r180'  : true,
    'r270'  : false
};


var teeDouble = function (d, card) {
    // since this is a double, play it as a tee
    // card is direction of old tip
    // use this to encode the initial orthogonal 
    // direction of play for doubles, see cardinal array
    var doubleCard = teeRotation[card].r;

    d.addClass('doubleTip');
    d.addClass('anyTip');
    d.removeClass(anyRotation);
    if (doubleCard !== 'r0') {
        d.addClass(doubleCard);
    }
    // console.log("tee double position is ", doubleCard, d.position());
};

var isDouble = function (d) {
    var l = parseInt(d.attr('lPips'), 10),
        r = parseInt(d.attr('rPips'), 10);
    return (l==r);
};


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

var removeTip = function (tip, card) {
    var rot = getRotation(tip);

    if (tip.hasClass('doubleTip')) {
        tip.removeClass('doubleTip');
        // after extending past the tee, the tips are playable, too
        tip.addClass('leftTip');
        tip.addClass('rightTip');
        // but this domino will not count in anymore scoring
        tip.addClass('noScore');
    } else {
        var wt = whichTips[rot][card];
        tip.removeClass(wt[0]);
        if (!tip.hasClass(wt[1])) {
            tip.removeClass('anyTip');
        }
    }
    tip.draggable({ disabled: true });
};

var addTip = function (d, newCard) {
    var rot = getRotation(d),
        wt = whichTips[rot][newCard];
    d.addClass(wt[0]);
    d.addClass('anyTip');
};

var pips = function (domino, lrPips) {
    var $domino = $(domino);
    p = parseInt($domino.attr(lrPips), 10);
    // console.log("in pips", lrPips, p);
    return p;
};

var sumTips = function () {
    var score = 0, old = 0, tips = 0;
    $('.anyTip').each(function(index, domino){
        $domino = $(domino);
        if ($domino.hasClass("noScore")) {
            // skip, continue .each loop
            return true;
        }
        if ($domino.hasClass('leftTip')) {
            tips += pips(domino, 'lPips');
        }
        if ($domino.hasClass('rightTip')) {
            tips += pips(domino, 'rPips');
        }
        if ($domino.hasClass('doubleTip')) {
            tips += 2*pips(domino, 'lPips');
        }
    });
    
    $('.tipSum').text(tips.toString());
    if ((tips%5) === 0) {
        old = parseInt(scoreForPlayer.text(), 10);
        score = (tips/5);
        // console.log("old", old, " +", score);
        scoreForPlayer.text((old+score).toString());
    }
};

var nextRotation = {
    'r0'    : 'r90',
    'r90'   : 'r180',
    'r180'  : 'r270',
    'r270'  : 'r0'
};

var goVertical = function (pos) {
    return {
        top : pos.top + 18,
        left: pos.left - 18
    };
};

var goHorizontal = function (pos) {
    return {
        top : pos.top - 18,
        left: pos.left + 18
    };
};

var rotateMe = function (me) {
    // Instead of simply spinning, which is nice but confusing
    // for placing dominoes, spin such that my top/left position
    // remains constant in all four cardinal directions
    var mySpin, myNext;

    $me = $(me);
    mySpin = getRotation($me);
    myNext = nextRotation[mySpin];
    $me.removeClass(anyRotation);
    pos = $me.position();
    if (horizontal[myNext]) {
        $me.css(goHorizontal(pos));
    } else {
        //console.log("leaving horizontal rotation, pos = ", pos);
        $me.css(goVertical(pos));
    }
    if (myNext != 'r0') {
        $me.addClass(myNext);
    }
    // console.log("after rotation, position is ", myNext, $me.position());
};


$(document).ready(function() {
    setUpPlayers(document.URL || location.href);
    setUpBoneyard();
    $('label').click(function(){
        // try instead scoreForPlayer = $(this).children(":eq(2)"); 
        scoreForPlayer = $($(this).children()[2]);
        scorePlayerName = $($(this).children()[1]).text();
        if ($(this).prev()[0].id == 'radioA') {
            selectedPlayer = $('.playerA').text();
            unselectedPlayer = $('.playerB').text();
            unselectedButton = $('#radioB');
            otherScore = $('.scoreB');
        } else {
            unselectedPlayer = $('.playerA').text();
            unselectedButton = $('#radioA');
            otherScore = $('.scoreA');
            selectedPlayer = $('.playerB').text();
        }
        // visually indicate choice cannot be changed
        var radbut = $(unselectedButton.next().children()[0]);
        radbut.css("border-color", "#000");
        setUpMessaging();
        $('#boneyard').css('display', '');
    });
    $('.startBox').droppable({
        drop: function (event, ui) {
            // console.log(ui.draggable, 'dropped on me', $(this));
            setFirstDomino(ui.draggable);
            $(this).hide();
        }
    });
    $('.domino').each(function(index, domino){
        $domino = $(domino);
        $domino.draggable({
            grid: [ 9, 9 ],
            drag: function () {
                messageDominoData($(this), "", "drag", false);
            },
        });
        $domino.mouseleave(function(e){
            // if there is an (important) message on the queue, resend it
            if (unsentMessages.length) {
                console.log("resend a message", unsentMessages);
                var oldMessage = unsentMessages.pop();
                var d = $(document.getElementById(oldMessage.dominoId));
                messageDominoData(d, oldMessage.playerName, "resending", true);
            }
        });
        $domino.dblclick(function(event) {
            console.log("double click");
            rotateMe(this);
            messageDominoData($(this), "", "just rotated", true);
            // event.preventDefault();
            // console.log("after rotate, position is: ", $(this).position());
            // Read the position
            // var pos = $(this).adjustedPosition();    
            // console.log("adjusted pos is: ", pos);
            // $(this).css(pos);
        });
        // $domino.mousedown(function() {
        // });
        $domino.one('mouseup', function(){
            // change this to flip the domino when it is picked 
            // by a player; the message to the other player will
            // move the domino but label it as the opponent's, not
            // flipped.  Only flip for both players once the piece
            // is played.
            revealFront($(this));
            messageDominoData($(this), scorePlayerName, "picked not played", true);
        });
        $domino.mouseup(function() {
            // console.log("mouse up", $(this).position());
            var $d = $(this);
            console.log('any mouseup for ', $(this)[0].id);
            $('.anyTip').each(function(index, tip){
                $tip = $(tip);
                // http://www.stoimen.com/blog/2010/03/31/jquery-get-the-id-of-the-current-element/
                // if ($tip.attr('id') == $d.attr('id')) {
                if ($tip.id == $d.id) {
                    // don't match with myself, continue .each loop
                    return true;
                }
                var placed = false;
                if ($tip.hasClass('doubleTip')) {
                    placed = nearTip($tip, 'doubleTip', $d);
                    // mutually exclusive with right and left
                    if (placed) {
                        sumTips();
                        messageDominoData($d, "", "placed first....", true);
                    }
                    return !placed;
                }
                if ($tip.hasClass('rightTip')) {
                    placed = nearTip($tip, 'rightTip', $d);
                }
                // if (!placed && $tip.hasClass('leftTip')) {
                if ($tip.hasClass('leftTip')) {
                    // the first piece played will have both r & l tips
                    // likewise a double after both long edges are played
                    placed = nearTip($tip, 'leftTip', $d) || placed;
                }
                if (placed) {
                    sumTips();
                    messageDominoData($d, "", "placed second...", true);
                }
                // if placed, return false to stop .each() loop
                return !placed;
            });
            // console.log("eom for ", $d);
            // messageDominoData($d, "", "end of mouseup");
        });
    });
});

$(window).unload(function(){
    ccps.closeConnection();
});
