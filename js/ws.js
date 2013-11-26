var CCPS_VERSION = "Carbon Copy Pub/Sub via web sockets, for little demo games.";

/*
 * To run locally:
 *
 http://kaazingcorp.cachefly.net/com/file/Kaazing-QS-JMS-Edition-Feb-2012.pdf
 *
 */


var ccps = {
    /**
     * the sole purpose of this object literal is to encapsulate variable names
     * and avoid unexpected conflicts in the global namespace
     */

    // JMS properties

    connection : undefined,
    session : undefined,

    // Sessions use topics (or queues) to define a destination shared by
    // message producers and consumers, sort of like a phone line or a
    // party line when there are more than two participants.

    // Set the topic dynamically for players to share, or use this
    // default for testing purposes.
    queue : "/queue/mcpq",
    // var destination = "/topic/lighttable" + QueryString.id;
    producer : undefined,
    // the consumer can be a local var in startMessaging
    // consumer : undefined,
    

    // userId could also be set dynamically for a player.  The only firm
    // requirement is that it be not equal to the userID sent with
    // messages from other players.  Used to prevent processing the
    // echo of your own sent messages, except when you explicitly want to.
    userId : Math.floor(Math.random(100000) * 100000).toString(),
    sending : false,

    // Not all messages need to represent exactly the same pieces
    // of data.  You could set a type property by adding this:
    //  "messageType": "MESSAGE_TYPE",
    // and defining this:
    
    // MESSAGE_TYPES : {
    //    "imgMoved": "IMGMOVED",
    //    "justText": "JUSTTEXT"
    // };

    /*
      Setup actions for a game:
        startConnection
      startMessaging
      startListening (or set element event handlers in html file)
    send messages about play
    */
    
    startConnection : function (url, myQ, yourQ, onStartCallback, messageProps, gotMessagePlay) {
        /**
         * Connect to JMS, create a session and start it.
         *
         * @param url {String} the websocket url of the form ws:// or wss://
         * @param myQ {String} the name of the queue to use for messaging
         * @param yourQ {String} the name of the queue to use for messaging
         * @param onStartCallback {Function} callback passed to connection.start
         * @param messageProps {Object} defines message properties used for data
         * @param gotMessagePlay {Function} callback for a received message
         *
         * If yourQ is "", then use the same queue for both producer and consumer.
         */
        ccps.log("Connecting to " + url);

        ccps.myQ = myQ;
        ccps.yourQ = yourQ;
        ccps.MESSAGE_PROPERTIES = messageProps;
        // add the property we need to keep track of ours vs. theirs
        ccps.MESSAGE_PROPERTIES["clientId"] = "CLIENTID";
        ccps.gotMessagePlay = gotMessagePlay;
        // local vars are not needed outside of this function
        var stompConnectionFactory = new StompConnectionFactory(url);

        try {
            // if needed, pass username and password to createConnection
            var connectionFuture = stompConnectionFactory.createConnection(function() {
                if (!connectionFuture.exception) {
                    try {
                        ccps.connection = connectionFuture.getValue();
                        ccps.connection.setExceptionListener(ccps.logException);
                        ccps.log("Now connected to " + url);
                        ccps.startMessaging();
                        ccps.connection.start(onStartCallback);
                    } catch (e) {
                        ccps.logException(e);
                    }
                } else {
                    ccps.logException(connectionFuture.exception);
                }
            });
        } catch (e) {
            ccps.logException(e);
        }
    },

    startMessaging : function () {
        // create a session and then start it.
        ccps.session = ccps.connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        // should the session be explicitly closed?
        // maybe on $(window).unload?

        // should these steps be inside the callback passed to start?
        // why or why not?  I've seen demos done both ways.
        // tutorial creates producer and consumer before connection.start
        // lighttable creates them inside the callback
        // since you can create additional topics later, probably does not
        // matter one way or the other.

        var myQ = ccps.session.createQueue(ccps.myQ);
        var yourQ;

        if (ccps.yourQ !== "") {
            yourQ = ccps.session.createQueue(ccps.yourQ);
        } else {
            yourQ = myQ;
        }
        ccps.producer = ccps.session.createProducer(myQ);
        var consumer = ccps.session.createConsumer(yourQ);
        // for synchronous messages, we could call consumer.receiveNoWait
        // we want asynchronous delivery, so set a listener
        consumer.setMessageListener(ccps.getMessagePlay);
    },


    logException : function (e) {
        ccps.log("EXCEPTION: " + e);
    },

    log : function(s) {
        // use this instead of console.log in case you want to
        // add a DEBUG mode later, or log to a different place etc
        console.log(s);
    },

    getMessagePlay : function (gotMessage) {
        /**
         * Extract the data from the message properties, pass to callback.
         *
         * @gotMessage {Message} a JMS message via the STOMP library
         *
         */
        var msgTxt = gotMessage.getText(),
            msgFrom = gotMessage.getStringProperty(ccps.MESSAGE_PROPERTIES.clientId);
        if (msgFrom != ccps.userId) {
            // ccps.log("message from " + gotMessage.getStringProperty(ccps.MESSAGE_PROPERTIES.clientId));
            // set message properties from client, instead of defining it
            // in this helper file.  Then for sending a message, iterate over properties.
            // for receiving a message, call getPropertyNames and then iterate to extract
            // the named properties and send that object literal back to the game code,
            // which should (also) check for null or undefined properties
            //
            // until then, just use the globals from lighttable.js??
            // or stick them in an lt objlit?
            var messagePropValues = {};
            for (var pk in ccps.MESSAGE_PROPERTIES) {
                if (pk === ccps.MESSAGE_PROPERTIES.clientId) {
                    continue;
                } else {
                    // note that if the property is missing from this message,
                    // getStringProperty will return undefined, which is what
                    // we want to set the message value to anyway in that case
                    messagePropValues[pk] = gotMessage.getStringProperty(ccps.MESSAGE_PROPERTIES[pk]);
                }
            }

            ccps.gotMessagePlay(messagePropValues);
            ccps.log("processed: " + " " + msgFrom + " " + ccps.queue + " " + msgTxt);
            
        } else {
            // oh, this is a message from me.  Disregard.
            ccps.log("echo: " + " " + msgFrom + " " + ccps.queue + " " + msgTxt);
        }
    },

    sendMessagePlay : function (messagePropValues, msgTxt) {
        /**
         * Send a message about something that happened in my app.
         *
         * @param messagePropValues {Object} data to send
         *
         * Each bit of data is paired with a name that matches a key in
         * ccps.MESSAGE_PROPERTIES.  The data must be converted to a string
         * before it can be added to the message as a string property for
         * its appropriate property name.
         *
         * might want to be a bit more defensive about premature calls, null data, etc.
         */

        if (!ccps.sending) {
            ccps.sending = true;
            var newMessage;
            // create a new message.  The text of this message is unused
            // so you can make it be whatever you want.
            try {
                newMessage = ccps.session.createTextMessage(msgTxt);
            } catch (e) {
                ccps.logException(e);
            }
            try {
                // identify it as coming from me
                newMessage.setStringProperty(ccps.MESSAGE_PROPERTIES.clientId, ccps.userId);
            } catch (e) {
                ccps.logException(e);
            }
            // ccps.log(messagePropValues);
            for (var pk in ccps.MESSAGE_PROPERTIES) {
                if (pk === ccps.MESSAGE_PROPERTIES.clientId) {
                    continue;
                } else if (messagePropValues[pk] !== undefined) {
                    // should we skip over empty strings for all props but
                    // scale and rotate?  hope not.
                    newMessage.setStringProperty(ccps.MESSAGE_PROPERTIES[pk], messagePropValues[pk].toString());
                }
            }
            // ccps.log("calling producer");
            // ccps.log(newMessage);
            // send the newMessage via the producer of messages
            try {
                ccps.producer.send(null, newMessage, DeliveryMode.PERSISTENT, 3, 1, function() {
                    // ccps.log("callback inside Send, reset sending false");
                    ccps.sending = false;
                });
            } catch (e) {
                ccps.logException(e);
            }
            // ccps.log("Message sent by " + ccps.userId);
            return true;
        } else {
            ccps.log("busy sending... msg ignored: " + msgTxt);
            return false;
        }
    }
};

