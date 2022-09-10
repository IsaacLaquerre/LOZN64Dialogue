var scripts = ["./scripts/epilogue.script"];

var eventStack = [];
var eventIndex = 0;

var speakingSpeed = 60;

var noPauseCharacters = [" ", "?", "!"];
var smallPauseCharacters = [".", ","];

var waitingForAction = false;

var doNext = () => {};

var binds = {
    "a": { name: "action", pressed: false, exec: () => {
        if (waitingForAction) doNext();
    } }
}

function start() {
    eventStack[eventIndex].run();
}

async function loadEvents() {
    return new Promise((resolve) => {
        for (i in scripts) {
            readScriptFile(scripts[i]).then(text => {
                var lines = text.split("\r\n\r\n");
                for (index in lines) {
                    console.log(index, lines[index]);
                    eventStack.push({ type: "SPEAK", text: lines[index], run: () => {
                        console.log(index, lines[index]);
                        speak(lines[index]);
                    } });
                }
                console.log(eventStack);
                resolve();
            });
        }
    });
}

function nextEvent() {
    if (eventIndex >= (eventStack.length - 1)) return;
    eventIndex++;
    eventStack[eventIndex].run();
}

function keyDown(e) {
    if (binds[e.key] != undefined && !binds[e.key].pressed) {
        binds[e.key].pressed = true;
        binds[e.key].exec();
    }
}

function keyUp(e) {
    if (binds[e.key] != undefined && binds[e.key].pressed) {
        binds[e.key].pressed = false;
    }
}

function speak(text) {
    var dialogueText = document.querySelector("#dialogueText");
    var speed = speakingSpeed;
    var textIndex = 0;
    var speakInterval = setInterval(() => {
        if (textIndex >= text.length) {
            doneSpeaking();
            return clearInterval(speakInterval);
        }
        speed = speakingSpeed;
        if (noPauseCharacters.includes(text[textIndex])) {
            dialogueText.innerHTML += " " + text[textIndex + 1];
            textIndex++;
        } else if (smallPauseCharacters.includes(text[textIndex])) {
            dialogueText.innerHTML += text[textIndex];
            speed = speed / 2;
        }else dialogueText.innerHTML += text[textIndex];
        textIndex++;
    }, speed);
}

function doneSpeaking() {
    var square = document.createElement("div");
    square.classList.add("dialogueSquare");
    document.querySelector("#dialogueBox").appendChild(square);
    waitingForAction = true;
    doNext = () => {
        square.remove();
        document.querySelector("#dialogueText").innerHTML = "";
        nextEvent();
    }
}

function readScriptFile(file) {
    return new Promise((resolve, reject) => {
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, false);
        rawFile.onreadystatechange = () => {
            if(rawFile.readyState === 4) {
                if(rawFile.status === 200 || rawFile.status == 0) {
                    var allText = rawFile.responseText;
                    return resolve(allText);
                } else reject(new Error("Couldn't read file " + file));
            } else reject(new Error("Couldn't read file " + file));
        }
        rawFile.send(null);
    });
}