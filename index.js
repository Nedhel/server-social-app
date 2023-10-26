const express = require("express"); //Create express instance
const { createServer } = require("node:http"); //Algo para combinar el servidor http con io
const cors = require("cors"); // Cors module to handle cross origin
const { join } = require("node:path"); //I use this to get the root path, just in case server serv web page as well
const { Server } = require("socket.io"); //To create a socket.io server
const bodyParser = require("body-parser"); // Body-parser module to parse JSON objects
const formidable = require("formidable"); //Formidable is used to handle files in server
const fs = require("fs"); //Module to read files

//-------------------This code is to create servers, http server and Socket io server -----------------------------------
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000"], //I add cors because I have react app in other port,,,, this cors is to io request
    },
});
//------------------- -----------------------------------

//-------------------Using modules ------------------------------------------------

const { authenticateUser } = require("./modules/userAuth");
const { readPost, writePostJson } = require("./modules/post");

//-------------------This code is to enable CORS -----------------------------------
app.use(
    cors({
        origin: "http://localhost:3000", // enable CORS for localhost:3000,,,, this cors is to http request
    })
);

app.options("/", (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "task"); // Allow the 'task 'header
    res.header("Access-Control-Allow-Methods", "GET"); // Allow the GET method
    res.header("Access-Control-Allow-Methods", "POST"); // Allow the POST method
    res.sendStatus(200);
});
//------------------- -----------------------------------

//-------------------This code is to use BodyParser and I can use body data from the request -----------------------------------
const textBodyParser = bodyParser.text({
    limit: "20Mb",
    defaultCharset: "utf-8",
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//------------------- -----------------------------------

/* Descomentar si me traigo la carpeta build desde react
app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "index.html"));
});
*/

/* I don't need this code because I'm doing user validation with the midleware io.use
app.post("/login", textBodyParser, async function (req, res) {
    let data = JSON.parse(req.body);
    console.log(data); //print the HTTP Request Headers
    //console.log(req.headers); //print the HTTP Request Headers
    res.sendStatus(200);
}); */

io.use((socket, next) => {
    //console.log(socket.handshake.auth);
    if (
        authenticateUser(
            socket.handshake.auth.userName,
            socket.handshake.auth.password
        )
    ) {
        const username = socket.handshake.auth.userName;
        socket.username = username;
        next();
    } else {
        return next(new Error("invalid username"));
    }
});

//A user is connected
io.on("connection", (socket) => {
    const users = [];
    //Add the new user to array users where are all users connected
    for (let [id, socket] of io.of("/").sockets) {
        users.push({
            userID: id,
            username: socket.username,
        });
    }
    //send all user connected to the new user
    socket.emit("users", users);
    //send all post to the new user
    let post = readPost();
    socket.emit("post", post);

    //send the new user connected to all other users
    socket.broadcast.emit("user_connected", {
        userID: socket.id,
        username: socket.username,
    });
    //method to send a private message
    socket.on("private_message", ({ content, to }) => {
        //console.log(content, to);
        socket.to(to).emit("private_message", {
            content,
            from: socket.id,
        });
    });

    socket.on("disconnect", () => {
        console.log("user_disconnected");
        //Es para actualizar la lista de amigos conectados
        socket.broadcast.emit("user_disconnected", {
            userID: socket.id,
            username: socket.username,
        });
    });
});

// This point is the send the image saved in server
app.get("/data/imgs/:file", function (req, res) {
    let file = req.params.file;

    res.sendFile(__dirname + "/data/imgs" + "/" + file);
});

//This function handle files sended from client
app.post("/post", async function (req, res) {
    let form = new formidable.IncomingForm();
    form.parse(req, function (error, fields, file) {
        /* console.log(fields);
        console.log(file.file[0].filepath); */
        let userData = readPost();
        let numberOfPost = userData.length;

        let newpath = "";
        let savepicture = "";
        if (file.file) {
            let filepath = file.file[0].filepath;
            newpath = "./data/imgs/";
            newpath += fields.user + "" + numberOfPost + ".jpg";
            savepicture = fields.user + "" + numberOfPost + ".jpg";
            fs.rename(filepath, newpath, function () {
                res.send("Text with img posted!!");
                res.end();
            });
        } else {
            res.send("Text posted!!");
            res.end();
        }
        let newPost = {
            text: fields.text[0],
            img: savepicture,
            likes: 0,
        };
        console.log(newPost);
        writePostJson(fields.user, newPost);
        setTimeout(() => {
            let posts = readPost();
            io.emit("newPost", posts);
        }, 5000);
    });
});

server.listen(5000, (err) => {
    if (err) {
        console.log("There was a problem ", err);
    }
    console.log("server running at http://localhost:5000");
});
