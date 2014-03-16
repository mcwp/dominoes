require.config({
    paths: {
        "StompJms": '//demo.kaazing.com/lib/client/javascript/StompJms',
        "jquery": '//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min',
        "jquery-ui": '//ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min'
    }
});
require(
    ['fiveup', 'jquery', 'jquery-ui'],
    function (FiveUp) {
        // By not passing in $, I am choosing to use the global jquery instead.
        var localFiveUp = FiveUp; //creates local copy of FiveUp. Like newing up an object. In fact you can say new FiveUp.
        // If the FiveUp was not self-executing, you could say: var localFiveUp = new FiveUp(), which some might consider clearer.
        $(document).ready(function() {
            localFiveUp.setUpPlayers(document.URL || location.href);
            localFiveUp.setUpBoneyard();
            $('label').click( function () {
                // try using one instead of click here to prevent re-selection?
                localFiveUp.pickedPlayer(this);
            });
            $('.startBox').droppable({
                drop: function (event, ui) {
                    // console.log(ui.draggable, 'dropped on me', $(this));
                    localFiveUp.setFirstDomino(this, ui.draggable);
                }
            });
            $('.domino').each(function(index, domino){
                $domino = $(domino);
                $domino.draggable({
                    grid: [ 9, 9 ],
                    // drag: function () {
                    //     messageDominoData($(this), "", "drag", false);
                    // },
                });
                $domino.one('mouseup', function(){
                    // change this to flip the domino when it is picked 
                    // by a player; the message to the other player will
                    // move the domino but label it as the opponent's, not
                    // flipped.  Only flip for both players once the piece
                    // is played.
                    localFiveUp.revealFront(this);
                    // messageDominoData($(this), scorePlayerName, "picked not played", true);
                });
                $domino.dblclick(function(event) {
                    localFiveUp.rotateMe(this);
                    // messageDominoData($(this), "", "just rotated", true);
                });
            });
        });
    }
);
