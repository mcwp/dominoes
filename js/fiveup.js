define(
    // ['ccps'],
    [],
    // function (Ccps) {
    function () {
        // var ccps = new Ccps();
        var pub = {};
        pub.setUpPlayers = function (url) {
            // 
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
            var playerA = params.a || "Kat";
            var playerB = params.b || "Rinne";
            channel = params.c || 905120;
            $('.playerA').text(playerA);
            $('.playerB').text(playerB);
        };
        return pub;
    }
);