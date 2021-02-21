require('dotenv').config();

var express = require('express');
var app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname + '/interface'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/interface/index.html');
  });

http.listen(3000, () => {
  console.log('listening on *:3000');
});


io.on('connection', (socket) => {
    console.log('a user connected');
	moveEmitter.emit('sendListMoves', getListOfMoves(mapMoves));
});





const tmi = require('tmi.js');
const EventEmitter = require('events');

class MoveEmitter extends EventEmitter {}

const moveEmitter = new MoveEmitter();
moveEmitter.on('makeMove', (move) => {
  console.log('makeMove emitted!');
});moveEmitter.emit('event');
moveEmitter.on('sendListMoves', (moves) => {
  console.log('sendListMoves emitted!');
});moveEmitter.emit('event');

moveEmitter.on('makeMove', (move) => {
    io.emit('makeMove', move);
});

moveEmitter.on('sendListMoves', (moves) => {
    io.emit('sendListMoves', moves);
});

moveEmitter.on('sendGraphData', (moves) => {
    io.emit('sendGraphData', moves);
});






const NB_VOTES = 5;
const chess = require('chess');
let mapMoves = new Map();

// create a game client
const gameClient = chess.create();
gameClient.getStatus();
let move;

//Moves possibles initiaux
Object.keys(gameClient.getStatus().notatedMoves).forEach(move => mapMoves.set(move, 0));

moveEmitter.emit('sendListMoves', getListOfMoves(mapMoves));

// capture events
gameClient.on('check', (attack) => {
  // get more details about the attack on the King
  console.log(attack);
});



const client = new tmi.Client({
	options: { debug: true, messagesLogLevel: "info" },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: process.env.USERNAME,
		password: process.env.PASSWORD
	},
	channels: [ process.env.CHANNEL ]
});

client.connect().catch(console.error);
client.on('message', (channel, tags, message, self) => {
	if(self) return;
	if(message.toLowerCase() === '!hello') {
		client.say(channel, `@${tags.username}, heya!`);
	}
})

//client.say(channel, `@${tags.username}, heya!`);


client.on('message', (channel, tags, message, self) => {
	if(!message.startsWith('!')) return;

	const proposedMove = message.slice(1).split(' ')[0];

	let possibleMoves = getListOfMoves(mapMoves);

	//If proposedMove in possibleMoves
	if(possibleMoves.indexOf(proposedMove) > -1)
	{	
		if(mapMoves.get(proposedMove) == NB_VOTES - 1)
		{
			move = gameClient.move(proposedMove);	
			//Convert move newly done to good notation for chessboard.js on the view
			let newMove = move.move.prevSquare.file.toString().concat(move.move.prevSquare.rank.toString(),"-",move.move.postSquare.file.toString(),move.move.postSquare.rank.toString());
			
			moveEmitter.emit("makeMove", newMove);

			console.log(mapMoves);
			
			//Initialize mapMoves with new possible moves
			mapMoves.clear();
			Object.keys(gameClient.getStatus().notatedMoves).forEach(move => mapMoves.set(move, 0));
			moveEmitter.emit("sendListMoves", getListOfMoves(mapMoves))
			moveEmitter.emit('sendGraphData', getMovesData(mapMoves));
		}
		else
		{
			//Increment count for move
			mapMoves.set(proposedMove, mapMoves.get(proposedMove)+1);
			//Send data
			moveEmitter.emit('sendGraphData', getMovesData(mapMoves));
		}
	}
	else
	{
		console.log(proposedMove + " n'est pas un move")
	}
});

function getListOfMoves(map)
{
	return Array.from(map.keys());
}

function getMovesData(map)
{
	return Array.from(map.values());
}