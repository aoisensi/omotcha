import TMI from 'tmi.js';

const elementName = document.getElementById('name')!
const elementMessage = document.getElementById('message')!

const audioContext = new window.AudioContext();

const response = await fetch('SYS_text.ogg');
const arrayBuffer = await response.arrayBuffer();
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
class Message {
  constructor(public name: string, public message: string) {}
}

const stack: Message[] = [];

var ppp_id: number;
var hdd_id: number;
var waiting = false;

const client = new TMI.Client({
  // options: { debug: true },
  connection: {
    secure: true,
    reconnect: true
  },
  identity: {
    username: 'justinfan143',
  },
  channels: [ new URLSearchParams(window.location.search).get('channel') || 'twitchpresents' ]
});
client.connect().catch(console.error);
client.on('message', (_, tags, message, __) => {
  pushMessage(new Message(tags['display-name'] || 'Something', message));
});

function pushMessage(message: Message) {
  //if stack is empty
  if (stack.length === 0 || waiting) {
    show(message);
  } else {
    stack.push(message);
  }
}

function show(message: Message) {
  waiting = false;
  console.log(message.name, message.message);
  elementName.innerText = message.name;
  elementMessage.innerText = '';
  show_box();
  clearInterval(hdd_id);
  /*
  setTimeout(() => {
    const new_message = stack.shift();
    if(new_message) show(new_message);
  }, 5000);
  */
  var i = 0;
  ppp_id = setInterval(() => {
    i++;
    elementMessage.innerText = message.message.slice(0, i);
    play_text();
    if (i === message.message.length) {
      clearInterval(ppp_id);
      setTimeout(() => {
        const new_message = stack.shift();
        if(new_message){
          show(new_message)
        } else {
          waiting = true;
        }
      }, 3000);
      hdd_id = setTimeout(() => {
        console.log('hide')
        hide_box();
      }, 14300);
    }
  }, 66);
}

function show_box() {
  document.querySelectorAll('.box').forEach((e) => {
    e.classList.remove('hidden');
  });
}

function hide_box() {
  document.querySelectorAll('.box').forEach((e) => {
    e.classList.add('hidden');
  });
}

function play_text() {
  const randomPitch = 0.9 + Math.random() * 0.2;
  const audioSource = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  gain.gain.value = 0.1;
  audioSource.buffer = audioBuffer;
  audioSource.playbackRate.value = randomPitch;
  audioSource.playbackRate
  audioSource.connect(gain);
  gain.connect(audioContext.destination);
  audioSource.start(0);
}
