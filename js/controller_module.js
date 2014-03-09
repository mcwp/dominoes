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
        });
    }
);