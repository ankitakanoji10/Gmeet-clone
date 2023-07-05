const express = require('express');
const app = express();
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});
const querystring = require("querystring");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const cors = require("cors");
const cookieParser = require("cookie-parser");
// import {
//     SERVER_ROOT_URI,
//     GOOGLE_CLIENT_ID,
//     GOOGLE_CLIENT_SECRET,
// } from "./config";
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/peerjs', peerServer);
app.use(
    cors({
        // Sets Access-Control-Allow-Origin to the UI URI
        origin: "http://127.0.0.1:5501/frontend/action.html",
        // Sets Access-Control-Allow-Credentials to true
        credentials: true,
    })
);

app.use(cookieParser());
const redirectURI = "auth/google";
function getGoogleAuthURL() {
    var rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    var options = {
        redirect_uri: "".concat("http://localhost:3030", "/").concat(redirectURI),
        client_id: "14953685355-gnhtffg4j5cdc29vc59t5mirjb33pbc4.apps.googleusercontent.com",
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
    };
    return "".concat(rootUrl, "?").concat(querystring.stringify(options));
}

app.get("/auth/google/url", (req, res) => {
    var url = getGoogleAuthURL()
    res.redirect(url);
});

function getTokens({ code, clientId, clientSecret, redirectUri }) {
    /*
     * Uses the code to get tokens
     * that can be used to fetch the user's profile
     */
    const url = "https://oauth2.googleapis.com/token"
    const values = {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
    }

    return axios
        .post(url, querystring.stringify(values), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })
        .then(res => res.data)
        .catch(error => {
            console.error(`Failed to fetch auth tokens`)
            throw new Error(error.message)
        })
}

app.get(`/${redirectURI}`, async (req, res) => {
    const code = req.query.code

    const { id_token, access_token } = await getTokens({
        code,
        clientId: "14953685355-gnhtffg4j5cdc29vc59t5mirjb33pbc4.apps.googleusercontent.com",
        clientSecret: "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",
        redirectUri: `${"http://localhost:3030"}/${redirectURI}`
    })

    // Fetch the user's profile with the access token and bearer
    var googleUser = await axios
        .get("https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=".concat(access_token), {
            headers: {
                Authorization: "Bearer ".concat(id_token)
            }
        })
        .then(function (res) { return res.data; })
        .catch(function (error) {
            console.error("Failed to fetch user");
            throw  Error(error.message);
        });

    const token = jwt.sign(googleUser, "ankita")

    res.cookie("auth_token", token, {
        maxAge: 900000,
        httpOnly: true,
        secure: false
    })

    res.redirect("http://localhost:3030")
})
app.get("/auth/me", (req, res) => {
    console.log("get me");
    try {
        const decoded = jwt.verify(req.cookies["auth_token"], "ankita");
        console.log("decoded", decoded);
        return res.send(decoded);
    } catch (err) {
        console.log(err);
        res.send(null);
    }
});
app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).emit('user-connected', userId);
        socket.on('message', message => {
            io.to(roomId).emit('createMessage', message)
        })
    })
})
server.listen(3030)