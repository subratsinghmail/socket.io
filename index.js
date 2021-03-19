const dotenv = require("dotenv");

dotenv.config({
  path: "./env",
});

const Users = require("./Controllers/ getUsers");
var path=require('path')
const User = require("./Models/users");
const sequelize = require("./utils /dataBase");
const express = require("express");
var cors = require("cors");
const app = express();
const http = require("http").Server(app);
const SocketIOFile = require("socket.io-file");
const fs = require("fs");
const { format_on_Connect, format } = require("./messageFormat");
var base64id = require("base64id");
const chat = require("./Models/ChatConnection");



var corsOptions = {
  origin: `http://localhost:3000`,
};



//for media dowloads.
app.use("/media", cors(corsOptions), (req, res, next) => {
  let query = req.query.fileName;

   console.log(__dirname)

  console.log("i am in this route");

  res.download(`./${query}`);
});

app.get("/allUsers", Users.getAllActiveUsers);

app.get("/getChats", cors(corsOptions), Users.getChats);



app.use("/", (req, res, next) => {
  res.sendFile(__dirname + "/index.html");
});

const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

var adminSocket = null;

io.use((socket, next) => {
  if (socket.handshake.auth.token) {
    let id = socket.handshake.auth.token;
    User.findOne({ where: { email: id } })
      .then(async (user) => {
        if (user == null) {
          return User.create({
            email: id,
            status: true,
            uid: base64id.generateId(),
            socketID: socket.id,
            isAdmin: id == "admin" ? true : false,
          });
        } else {
          user.socketID = socket.id;
          user.status = true;

          await user.save();

          return user;
        }
      })
      .then((updatedUser) => {
        if (id !== "admin") {
          console.log("1.", "coming");
        } else socket.broadcast.emit("welcome_message", "welcome");
        next();
      })

      .catch((err) => {
        console.log(err);
      });
  }
}).on("connection", (socket) => {


  var uploader = new SocketIOFile(socket, {
    // uploadDir: {			// multiple directories
    // 	music: 'data/music',
    // 	document: 'data/document'
    // },
    uploadDir: 'data',							// simple directory
    accepts: [],		// chrome and some of browsers checking mp3 as 'audio/mp3', not 'audio/mpeg'
    maxFileSize: 4194304, 						// 4 MB. default is undefined(no limit)
    chunkSize: 10240,							// default is 10240(1KB)
    transmissionDelay: 0,						// delay of each transmission, higher value saves more cpu resources, lower upload speed. default is 0(no delay)
    overwrite: true 							// overwrite file if exists, default is true.
});

uploader.on('start', (fileInfo) => {
  console.log('Start uploading');
  console.log(fileInfo);
});
uploader.on('stream', (fileInfo) => {
  console.log(`${fileInfo.wrote} / ${fileInfo.size} byte(s)`);
});
uploader.on('complete', (fileInfo) => {
  console.log('Upload Complete.');
  console.log(fileInfo);
});
uploader.on('error', (err) => {
  console.log('Error!', err);
});
uploader.on('abort', (fileInfo) => {
  console.log('Aborted: ', fileInfo);
});

















  socket.on("create", (roomID) => {
    let username;

    console.log(roomID, "this is the roomID");

    User.findOne({ where: { email: socket.handshake.auth.token } })
      .then((res) => {
        //  console.log(res);
        username = res.email;
        //  console.log(socket.handshake.auth.token);
        return chat.findOne({ where: { uid: res.uid } });
      })
      .then((res) => {
        console.log(roomID);
        if (res !== null) {
          chat
            .update(
              { roomID: roomID },
              {
                where: {
                  uid: res.uid,
                },
              }
            )
            .then((res) => {
              console.log("updated successfully");

              socket.join(roomID);
              socket.broadcast.emit(
                "message",
                format_on_Connect(username, socket.id, true, roomID)
              );
            })
            .catch((err) => {
              console.log("there has been a error in updating");
            });
        } else {
          console.log("user not found");
          User.findOne({ where: { email: socket.handshake.auth.token } })
            .then(async (res) => {
              await chat.create({
                uid: res.uid,
                client: socket.handshake.auth.token,
                roomID: roomID,
              });

              //joins the rooom ID.
              socket.join(roomID);
              socket.broadcast.emit(
                "message",
                format_on_Connect(username, socket.id, true, roomID)
              );
            })
            .catch((err) => {
              console.log(err);
            });
        }
      });
  });

  //admin joins the configured room id.
  socket.on("joinRoom", async (roomID) => {
    let admin = await User.findOne({
      where: { email: socket.handshake.auth.token },
    });

    console.log(admin.uid);
    chat
      .findOne({ where: { roomID: roomID } })
      .then((res) => {
        return chat.update({ admin: admin.uid }, { where: { roomID: roomID } });
      })
      .then((res) => {
        socket.join(roomID);
        socket.broadcast.emit("welcome_message", `you joned this ${roomID}`);
      })
      .catch((err) => {
        console.log(err);
      });
  });

  //for firing the chat event
  socket.on("private_message", (info, callback) => {
    //for listenting to the events.
    let json = {};

    let obj = format(
      info.user,
      info.message,
      info.room,
      1,
      info.time_sent,
      info.messageID,
      info.read
    );

    chat
      .findOne({ roomID: info.room })

      .then((res) => {
        json = JSON.parse(JSON.stringify(res.chat));
        console.log("before", json);
        json.push(obj);
        console.log("after", json);

        res.chat = json;
        // console.log(json)

        return chat.update({ chat: json }, { where: { roomID: info.room } });
      })
      .then((result) => {
        console.log("message saved succeccfully");
        console.log(result);

        io.in(info.room).emit("pvt_message", obj);
      })
      .catch((err) => {
        console.log(err);
      });

    // console.log(info);
  });

  //for sharing private files.
  socket.on("private_file", (room, uploadDir) => {
    console.log(`private file is being shared`);

    // console.log(room)
    //  console.log(uploadDir)

    io.in(room).emit("pvt_file", uploadDir);
  });
  //sends a notification that message has been received by the user.
  socket.on("ack", (ack, roomID, message_ID) => {
    console.log("acknowledgement fires.");
    socket.to(roomID).emit("admin_ack", ack, message_ID);
  });

  //on disconnect this will be fired upon
  socket.on("disconnecting", () => {
    //lets everynoe know that user has left the chat

    //  let a;
    // for(const s of socket.rooms.keys()){
    //       console.log(s);
    //   }
    User.update(
      { status: false },
      {
        where: {
          socketID: socket.id,
        },
      }
    )
      .then((res) => {
        console.log(`${socket.id}`, "user has disconnected");

        socket.broadcast.emit("disconnect_message", socket.id);
      })
      .catch((err) => {
        console.log(err);
      });

    // console.log(socket.rooms);

    // console.log(`${socket.id} is disconnecting`);
  });

  //runs when a chat message event is fired.
  socket.on("chat message", (msg) => {
    console.log("chat event is fired");
    io.emit("message", format(`${socket.id}`, msg));
  });

  socket.on("emit_type", (info) => {
    socket.to(info.roomID).emit("typing", info.message, info.user);
  });
});



http.listen(8080, () => {
  console.log("listening on *:8080");
});
