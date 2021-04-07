const { desktopCapturer, remote } = require('electron');
const { writeFile } = require('fs');
const { dialog, Menu } = remote;

let mediaRecorder; //instance to capture the footage
const recordedChunks = [];

const videoElement = document.querySelector('video');

// Start
const startBtn = document.getElementById('startBtn');
startBtn.onclick = (e) => {
	mediaRecorder.start();
	startBtn.classList.add('is-danger');
	startBtn.innerText = 'Recording';
	startBtn.setAttribute('disabled', true);
};

// Stop
const stopBtn = document.getElementById('stopBtn');

stopBtn.onclick = (e) => {
	mediaRecorder.stop();
	startBtn.classList.remove('is-danger');
	startBtn.innerText = 'Start';
	startBtn.disabled = false;
};

const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

async function getVideoSources() {
	const inputsources = await desktopCapturer.getSources({
		types: ['window', 'screen', 'audio'],
	});

	const videoOptionMenu = Menu.buildFromTemplate(
		inputsources.map((source) => {
			return {
				label: source.name,
				click: () => selectSource(source),
			};
		})
	);

	videoOptionMenu.popup();
}

async function selectSource(source) {
	videoSelectBtn.innerText = source.name;

	const constraints = {
		audio: false,
		video: {
			mandatory: {
				chromeMediaSource: 'desktop',
				chromeMediaSourceId: source.id,
			},
		},
	};

	// create a Stream
	const stream = await navigator.mediaDevices.getUserMedia(constraints);

	//Preview the Source a video element
	videoElement.srcObject = stream;
	videoElement.play();

	//create the media recorder
	const option = { MimeType: 'video/webm; codecs=vp9' };
	mediaRecorder = new MediaRecorder(stream, option);

	// register Event handlers
	mediaRecorder.ondataavailable = handleDataAvailable;
	mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
	console.log('video Data Available');
	recordedChunks.push(e.data);
}

async function handleStop(e) {
	const blob = new Blob(recordedChunks, {
		type: 'video/webm; codec=vp9',
	});

	const buffer = Buffer.from(await blob.arrayBuffer());

	const { filePath } = await dialog.showSaveDialog({
		buttonLabel: 'save video',
		defaultPath: `vid-${Date.now()}.mp4`,
	});

	if (filePath) {
		writeFile(filePath, buffer, () => console.log('video saved successfully'));
	}
}
