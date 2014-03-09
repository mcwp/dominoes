define(
    // ['ccps'],
    [],
    // function (Ccps) {
    function () {
        // var ccps = new Ccps();
        var pub = {};

        var shuffle = function (array) {
            var m = array.length, t, i;

            // While there remain elements to shuffle…
            while (m) {

                // Pick a remaining element…
                i = Math.floor(Math.random() * m--);

                // And swap it with the current element.
                t = array[m];
                array[m] = array[i];
                array[i] = t;
            }

            return array;
        };

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

        pub.setUpBoneyard = function () {
            // create the dominoes
            var dominoes = [    ['db', 0, 0],   ['d6', 6, 6],   ['d5', 5, 5],
                ['d4', 4, 4],   ['d3', 3, 3],   ['d2', 2, 2],   ['d1', 1, 1],
                ['b6', 0, 6],   ['b5', 0, 5],   ['b4', 0, 4],   ['b3', 0, 3],
                ['b2', 0, 2],   ['b1', 0, 1],   ['56', 5, 6],   ['46', 4, 6],
                ['36', 3, 6],   ['26', 2, 6],   ['16', 1, 6],   ['45', 4, 5],
                ['35', 3, 5],   ['25', 2, 5],   ['15', 1, 5],   ['34', 3, 4],
                ['24', 2, 4],   ['14', 1, 4],   ['23', 2, 3],   ['13', 1, 3],
                ['12', 1, 2], ];

            var backimg = '<img src="https://dl.dropboxusercontent.com/u/78878172/domis/back.png"/>';
            var shuffled = shuffle(dominoes);
            for (i=0; i < shuffled.length; i++) {

                var d = shuffled[i][0];

                var dburl = "https://dl.dropboxusercontent.com/u/78878172/domis/";
                var pic = dburl + d + ".png";
                var newd = "<div id=" + d + "/>" + "</div>";
                $('div#boneyard').append($(newd).addClass('domino'));
                var newDomi = $('div#'+d);
                newDomi.append($(backimg).data('front', pic));
                newDomi.data('lPips', shuffled[i][1]);
                newDomi.data('rPips', shuffled[i][2]);
                var pos = {
                    top: ((i%3)*9).toString(),
                    left: ((i%3)*9).toString()
                };
                newDomi.css(pos);
            }
            // $('#boneyard').hide();
        };

        return pub;
    }
);