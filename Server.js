//Server which handles 2 ports
//Vars
var WebSocket = require('ws');
var outPort = 8080;

var clientsList ={};
var connectedClientsList = {};
var connectionIDCounter = 0;
var colors = ["AliceBlue","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","ForestGreen","Fuchsia","Gainsboro","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","Yellow","YellowGreen"];

//-----------------------------------------------------
//WebSocket server
var WebSocketServer = WebSocket.Server;
var wsServer = new WebSocketServer({port: outPort});
console.log("Server is Open, connected to webSocket on port : " +outPort);

wsServer.on("connection", function(_connection) {
    try{
        var o_new_client = new client(_connection)
        var id = connectionIDCounter ++;
        o_new_client.init(id);

        colors.sort(function(a,b) { return Math.random() > 0.5; } );
    }catch(err){
        console.log("on(connection): ",err)
    }
});

//-----------------------------------------------------
//Misc Functions
//send message to all connected clients
function sendToAll(_message) {
    try{
        Object.keys(connectedClientsList).forEach(function(i) {
            var connection = connectedClientsList[i];
            console.log('now on: ' +i);
            if (connection.get_connection().readyState===WebSocket.OPEN) {
                console.log(i +' is connected, sending message');
                connection.get_connection().send(_message);
            }
        });
    }catch(err){
        console.log("function: sendToAll ",err)
    }
}

//send message to clients with the id in the list
function sendToSome(_data,_list) {
    try{
        var tempList =_list;
        Object.keys(tempList).forEach(function(i) {
            var connection = connectedClientsList[tempList[i]];
            if (connection.get_connection().readyState===WebSocket.OPEN) {
                console.log(i +' is connected, sending data');
                connection.get_connection().send(_data);
            }
        });
    }catch(err){
        console.log("function: sendToSome ",err)
    }
}

//on each connection/disconnect send te list of connected people
//TODO: change to send just the id that connected/disconnected
function sendConnectedClientsList(){
    try{
        var c_list =[];
        console.log("sent connection list");
        Object.keys(connectedClientsList).forEach(function(i) {
            var object = {
                name: connectedClientsList[i].get_name(),
                id: connectedClientsList[i].get_current_id(),
            };
            c_list.push(object);
        });
        var tempData = JSON.stringify({ type:'conList', data: c_list });
        sendToAll(tempData);
    }catch(err){
        console.log("function: sendConnectedClientsList ",err);
    }
}
/*
function sendNewConnection(_name,_id){
    var object = {
        name: _name,
        id: _id,
    };
    sendToAll(JSON.stringify({ type:'add_connection', data: object }));
}
function removeConnection(_name,_id){
    var object = {
        name: _name,
        id: _id,
    };
    sendToAll(JSON.stringify({ type:'remove_connection', data: object }));
}*/

function getUniqueId(){
    try{
        var crypto = require("crypto");
        return crypto.randomBytes(16).toString("hex");
    }catch(err){
        console.log("function: getUniqueId ",err)
    }
}

function saveHistory(_msg){
    try{
        Object.keys(connectedClientsList).forEach(function(i) {
            var connection = connectedClientsList[i];
            if (connection.get_connection().readyState===WebSocket.OPEN) {
                connectedClientsList[i].add_to_history(_msg);
            }
        });
    }catch(err){
        console.log("function: saveHistory ",err)
    }
};
function saveWhisperHistory(_msg,_tempList){
    try{
        Object.keys(_tempList).forEach(function(i) {
            var connection = connectedClientsList[_tempList[i]];
            if (connection.get_connection().readyState===WebSocket.OPEN) {
                connectedClientsList[_tempList[i]].add_to_history(_msg);
            }
        });
    }catch(err){
        console.log("function: saveHistory ",err)
    }
};
//-----------------------------------------------------------------------------
//client Object
function client(_connection){
    try{
        var o_connection = _connection;
        var o_client = this;
        var recived_mesgs = [];
        var uId = 0;
        var name = "";
        var color = "black";
        var current_id = 0;
        var active = false;

        this.init = function(_id){
            try{
                active = true;
                current_id = _id;
              }catch(err){
                  console.log("client.init",err)
              }
        }
        //server inbound Messages to Client------------------------------
        o_connection.on('message',function(_message){
            try{
                var json = JSON.parse(_message);
        		if(o_client[json.type] != null){
        			o_client[json.type](json);
        		}else{
        			console.log("json.type is incorrect: " +json.type);
        		}
            }catch(err){
                console.log("client.on(message)",err);
            }
        });

        o_connection.on('close', function(reasonCode, description) {
            try{
                console.log("Connection ID: " + current_id + ' disconnected.');
                delete connectedClientsList[current_id];
                sendConnectedClientsList();
                o_client.set_active(false);
                colors.push(o_client.color);
            }catch(err){
                console.log("client.on(close)",err)
            }
        });
        //----------------------------------------------------------------------
        //client's object functions
        this.register = function(_json){
            try{
                temp_name = _json.data;
                if(!clientsList[temp_name]){
                    uId = getUniqueId();
                    name = _json.data;
                    temp_color = colors.shift();
                    color = temp_color;
                    clientsList[name] = o_client;
                    connectedClientsList[current_id] = clientsList[name];
                    var object = {
                        name: _json.data,
                        uid: o_client.get_uid(),
                        id: o_client.get_current_id(),
                        color: temp_color,
                    };
                    var tempData = JSON.stringify({ type:'register', data: object });
                    o_connection.send(tempData);
                    sendConnectedClientsList();
                }else{
                    console.log("username: " +temp_name +" ,is taken");
                    send_error("username: " +temp_name +" ,is taken");
                }
                console.log("new Client with UID: " +uId +" ,id: "+current_id+" ,name is: "+name);
            }catch(err){
                console.log("client.register: ",err);
            }
        }
        this.login = function(_json){
            try{
                temp_name = _json.data;
                if(clientsList[temp_name]){
                    if(!clientsList[temp_name].get_active()){
                        loadFromList(o_connection,current_id,uId,temp_name);
                        temp_color = colors.shift();
                        o_client.set_color(temp_color);
                        var object = {
                            name: _json.data,
                            uid: o_client.get_uid(),
                            history: o_client.get_history(),
                            id: o_client.get_current_id(),
                            color: temp_color,
                        };
                        var tempData = JSON.stringify({ type:'login', data: object });
                        o_connection.send(tempData);
                        sendConnectedClientsList();
                    }else{
                        console.log(temp_name +" ,is already in use");
                        send_error(temp_name +" ,is already in use");
                    }
                }else{
                    console.log(temp_name +" ,does not exist");
                    send_error(temp_name +" ,does not exist");
                }
            }catch(err){
                console.log("client.login: ",err);
            }
        }
        this.message = function(_json){
            try{
                var current_time = new Date();
                var object = {
                    time: current_time.getTime(),
                    text: _json.data,
                    client: o_client.get_name(),
                    color: o_client.get_color(),
                };
                var tempData = JSON.stringify({ type:'message', data: object });

                var msg = o_client.get_name() +" ,"
                    +current_time.getHours() + ':' + current_time.getMinutes() + ': ' + _json.data;
                saveHistory(msg);

                sendToAll(tempData);
                console.log("got a message from: " +o_client.get_name() +" ,message is: " +_json.data);
            }catch(err){
                console.log("client.message: ",err);
            }
        }
        this.messageTo = function(_json){
            try{
                var current_time = new Date();
                var object = {
                    time: current_time.getTime(),
                    text: _json.data.text,
                    client: o_client.get_name(),
                    color: o_client.get_color(),
                };
                var tempData = JSON.stringify({ type:'message', data: object });

                temp_list = _json.data.list;
                temp_list.push(o_client.get_current_id());

                var msg = o_client.get_name() +" ,"
                    +current_time.getHours() + ':' + current_time.getMinutes() + ': ' + _json.data.text;
                saveWhisperHistory(msg,temp_list);

                sendToSome(tempData,temp_list);
            }catch(err){
                console.log("client.messageTo: ",err);
            }
        }

        function send_error(_error){
            try{
                var tempData = JSON.stringify({ type:'error', data: _error });
                o_connection.send(tempData);
            }catch(err){
                console.log("client.send_error: ",err);
            }
        }
        //test
        function loadFromList(_connection,_id,_uid,_name){
            o_client = clientsList[_name];
            o_client.set_uid(_uid);
            o_client.set_current_id(_id);
            o_client.setConnection(_connection);
            o_client.set_active(true);
            connectedClientsList[_id] = o_client;
        }
        //test
        //getters,setters for client object
        this.get_connection = function() {return o_connection;}
        this.setConnection = function(_connection){o_connection = _connection;}
        this.get_current_id = function() {return current_id;}
        this.set_current_id = function(_id){current_id = _id;}
        this.get_name = function() {return name;}
        this.get_color = function() {return color;}
        this.set_color = function(_color) {return color = _color;}
        this.get_uid = function(){return uId;}
        this.set_uid = function(_uid){uId = _uid;}
        this.get_active = function() {return active;}
        this.set_active = function(_bool){active = _bool;}
        this.get_history = function() {return recived_mesgs;}
        this.add_to_history = function(_msg){recived_mesgs.push(_msg);}

    }catch(err){
        console.log("client",err)
    }
}
