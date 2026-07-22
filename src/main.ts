import { ChatClient } from '@twurple/chat';
import { MessageQueue } from './MessageQueue';

const queueSystem = new MessageQueue(
  [...document.querySelectorAll<HTMLElement>('.box')],
  document.querySelector('#name')!,
  document.querySelector('#message')!,
  playAudio,
);

const audioContext = new window.AudioContext();

let audioBuffer: AudioBuffer;

async function loadAudio() {
  const response = await fetch('SYS_text.ogg');
  const arrayBuffer = await response.arrayBuffer();
  audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
}

loadAudio();

const twitchChat = new ChatClient({ channels: [new URLSearchParams(window.location.search).get('twitch') || 'twitchpresents'] });

twitchChat.onMessage(async (_, user, text) => {
  queueSystem.enqueue({ name: user, message: text });
});

twitchChat.connect();

function playAudio() {
  const randomPitch = 0.9 + Math.random() * 0.2;
  const audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  audioSource.playbackRate.value = randomPitch;
  audioSource.connect(audioContext.destination);
  audioSource.start(0);
}
