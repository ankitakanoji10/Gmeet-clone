


const socket = io('/')
const videoGrid = document.getElementById('video-grid')
let myVideoStream;
const myVideo = document.createElement('video')
myVideo.muted = true;

var peer = new Peer(undefined, {
    path: '/peerjs', 
    host: '/',
    port: '3030'
});

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    peer.on('call', call => {
        getUserMedia({ video: true, audio: true }, function (stream) {
            call.answer(stream);
            const video = document.createElement('video')
            call.on('stream', userVideoStream => {
                addVideoStream(video, userVideoStream)
            })
        }) 
    })

    socket.on('user-connected', (userId) => {
        connectToNewUser(userId, stream);
    })
})

peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
})


var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
const connectToNewUser = (userId, stream) => {
    getUserMedia({ video: true, audio: true }, function (stream) {
        const call = peer.call(userId, stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    });
    
    
    
}

const addVideoStream = (video, stream) => {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}

let text = $('input')


$('html').keydown((e) => {
    if (e.which == 13 && text.val().length !== 0) {
        console.log(text.val());
        socket.emit('message', text.val());
        text.val("");
    }
})

socket.on('createMessage', message => {
    $('ul').append(`<li class = "message"><b>user</b><br/>${message}</li>`)
})
const scrollToBottom = () => {
    let d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}
const setMuteButton = () => {
    const html = `
    <i class="fa-solid fa-microphone"></i>
    <span>Mute</span>
  `
    document.querySelector('.main__mute_button').innerHTML = html;
}
const setUnmuteButton = () => {
    const html = `
    <i class="unmute fa-solid fa-microphone-slash"></i>
    <span>Unmute</span>
  `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const playStop = () => {
    
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo()
    } else {
        setStopVideo()
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

const setStopVideo = () => {
    const html = `
    <i class="fa-solid fa-video"></i>
    <span>Stop Video</span>
  `
    document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
    const html = `
  <i class="stop fa-solid fa-video-slash"></i>
    <span>Play Video</span>
  `
    document.querySelector('.main__video_button').innerHTML = html;
}

const LeaveMeeting = () => {
    var url = "http://127.0.0.1:5500/frontend/action.html";
    window.location.replace(url);
}