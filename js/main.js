/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

'use strict';

const mainVideoElement = document.querySelector('video#mainVideo');
const pipVideoElement = document.querySelector('video#pipVideo');
const audioInputSelect = document.querySelector('select#audioSource');
const audioOutputSelect = document.querySelector('select#audioOutput');
const videoSelect = document.querySelector('select#videoSource');
const pipVideoSelect = document.querySelector('select#pipVideoSource');
const selectors = [audioInputSelect, audioOutputSelect, videoSelect, pipVideoSelect];

audioOutputSelect.disabled = !('sinkId' in HTMLMediaElement.prototype);

function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map(select => select.value);
  selectors.forEach(select => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'audiooutput') {
      option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    } else
      if (deviceInfo.kind === 'videoinput') {
        option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
        videoSelect.appendChild(option);

        const option2 = document.createElement('option');
        option2.text = deviceInfo.label || `camera ${pipVideoSelect.length + 1}`;
        pipVideoSelect.appendChild(option2);

      } else {
        console.log('Some other kind of source/device: ', deviceInfo);
      }
  }
  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
  if (typeof element.sinkId !== 'undefined') {
    element.setSinkId(sinkId)
      .then(() => {
        console.log(`Success, audio output device attached: ${sinkId}`);
      })
      .catch(error => {
        let errorMessage = error;
        if (error.name === 'SecurityError') {
          errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
        }
        console.error(errorMessage);
        // Jump back to first output device in the list as it's the default.
        audioOutputSelect.selectedIndex = 0;
      });
  } else {
    console.warn('Browser does not support output device selection.');
  }
}

function changeAudioDestination() {
  const audioDestination = audioOutputSelect.value;
  attachSinkId(mainVideoElement, audioDestination);
}

function gotStream(stream) {
  disableAudio(stream);
  //window.stream = stream; // make stream available to console
  mainVideoElement.srcObject = stream;
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}


function disableAudio(stream) {
  if (stream.getAudioTracks()[0] != undefined)
    stream.getAudioTracks()[0].enabled = false;
}

function gotStream2(stream) {
  disableAudio(stream);
  //window.stream = stream; // make stream available to console
  pipVideoElement.srcObject = stream;
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

function start() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const audioSource = audioInputSelect.value;
  const videoSource = videoSelect.value;
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };
  navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
}

function changepipVideo() {
  const audioSource = audioInputSelect.value;
  const videoSource = videoSelect.value;
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };
  navigator.mediaDevices.getUserMedia(constraints).then(gotStream2).catch(handleError);
}

videoSelect.onchange = start;
pipVideoSelect.onchange = changepipVideo;

start();
changepipVideo();


// Bind the pip checkfunction and show pip only when selected. 
const pipCheckbox = document.querySelector('input#pipEnabled');

pipCheckbox.onclick = function () {
  // alert("pipChanged " + pipCheckbox.checked);
  if (pipCheckbox.checked) {
    pipVideoElement.style.display = "inline-block";
  } else {
    pipVideoElement.style.display = "none";
  }
};

