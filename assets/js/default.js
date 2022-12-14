var started = false;

var scriptsDir = ["./scripts"];
var backgroundsDir = ["./assets/images/backgrounds"];
var spritesDir = ["./assets/images/sprites"];
var sfxDir = ["./assets/audio/sfx"];
var musicDir = ["./assets/audio/music"];

var scripts = [];
var backgrounds = {};
var sprites = {};
var sfx = {};
var music = {};

var eventStack = [];
var eventIndex = 0;
var ts = 0;
var lastTs = 0;

var speaking = false;
var speakingSpeed = 60;
var speakingSpeedTemp = 60;
var maxChars = 172;

var currentMusic = undefined;
var currentBackground = undefined;

var waitingForAction = false;

var doNext = () => {};

var binds = {
    "a": {
        name: "action",
        pressed: false,
        exec: () => {
            if (waitingForAction) {
                sfx.DialogueSelect.play();
                doNext();
            }
        }
    },
    "Enter": {
        name: "confirm",
        pressed: false,
        exec: () => {
            if (!started) {
                start();
                started = true;
            }
        }
    }
};

function start() {
    console.log(eventStack[eventIndex]);
    requestAnimationFrame(ts => update(ts));
    document.querySelector("#startMenu").remove();
    document.querySelector("#frame").style.backgroundImage = "none";
}

function loadAssets() {
    return new Promise((resolve) => {
        getDir(sfxDir).then(sfxList => {
            for (i in sfxList) {
                sfx[sfxList[i].split("/").pop().slice(0, -4)] = new SoundFile(sfxList[i]);
            }
            console.log(sfx);
        });
        getDir(musicDir).then(musicList => {
            for (i in musicList) {
                music[musicList[i].split("/").pop().slice(0, -4)] = new SoundFile(musicList[i]);
            }
            console.log(music);
        });
        getDir(backgroundsDir).then(backgroundsList => {
            for (i in backgroundsList) {
                backgrounds[backgroundsList[i].split("/").pop().slice(0, -4)] = backgroundsList[i];
            }
            console.log(backgrounds);
        });
        getDir(spritesDir).then(spritesList => {
            for (i in spritesList) {
                sprites[spritesList[i].split("/").pop().slice(0, -4)] = spritesList[i];
            }
            console.log(sprites);
        });
        resolve();
    });
}

function loadScripts() {
    return new Promise((resolve) => {
        getDir(scriptsDir).then(scriptsList => {
            for (i in scriptsList) {
                if (scriptsList[i].split(".")[scriptsList[i].split(".").length - 1].toLowerCase() === "script") {
                    readTextFile(scriptsList[i]).then(script => {
                        scripts.push(new Script(scriptsList[i], script));
                    });
                }
            }
            console.log(scripts);
            resolve();
        });
    });
}

async function loadEvents() {
    return new Promise((resolve) => {
        for (i in scripts) {
            for (index in scripts[i].lines) {
                var type = scripts[i].lines[index].split(" ")[0];
                var args = scripts[i].lines[index].split(" ").slice(1);
                switch (type) {
                    case "BACKGROUND":
                        eventStack.push({ type: "BACKGROUND", event: new BackgroudEvent(backgrounds[args[0]]) });
                        break;
                    case "MUSIC":
                        eventStack.push({ type: "MUSIC", event: new AudioEvent("MUSIC", music[args[0]], args[1], args[2]) });
                        break;
                    case "SFX":
                        eventStack.push({ type: "SFX", event: new AudioEvent("SFX", sfx[args[0]]) });
                        break;
                    case "SYNC":
                        eventStack.push({ type: "SYNC", event: new SyncEvent() });
                        break;
                    case "WAIT":
                        eventStack.push({ type: "WAIT", event: new WaitEvent(args[0]) });
                        break;
                    case "SPEAK":
                        var text = args.join(" ");
                        if (text.length > maxChars) {
                            var loops = 0;
                            var remainingLength = text.length;
                            var latestSpace;
                            while (remainingLength > 0) {
                                var chars = text.split("");
                                var lastSpace = chars.slice(latestSpace, maxChars * (loops + 1)).join("").lastIndexOf(" ") + maxChars * loops;
                                if (remainingLength > maxChars) var newText = text.substring(latestSpace, lastSpace);
                                else newText = text.substring(latestSpace);
                                eventStack.push({ type: "SPEAK", event: new SpeakEvent(newText) });
                                console.log(newText.length);
                                remainingLength -= maxChars;
                                latestSpace = lastSpace;
                                loops++;
                            }
                        } else eventStack.push({ type: "SPEAK", event: new SpeakEvent(text) });
                        break;
                    case "HIDE_DIALOGUE":
                        eventStack.push({ type: "HIDE_DIALOGUE", event: new DialogueBoxEvent("HIDE") });
                        break;
                    case "SHOW_DIALOGUE":
                        eventStack.push({ type: "SHOW_DIALOGUE", event: new DialogueBoxEvent("SHOW") });
                        break;
                    default:
                        break;
                }
            }
        }
        resolve();
    });
}

function update(timestamp) {
    var elapsed = timestamp - lastTs;

    lastTs = timestamp;

    if (eventStack[eventIndex].type === "SYNC") {
        if (eventIndex + 1 >= (eventStack.length - 1)) return;
        var event1 = eventStack[eventIndex + 1].event.update(elapsed);
        var event2 = eventStack[eventIndex + 2].event.update(elapsed);
        if (event1 && event2 && !waitingForAction) {
            if (eventIndex + 2 >= (eventStack.length - 1)) return;
            console.log(eventStack[eventIndex + 1]);
            eventIndex++;
            nextEvent();
        }
    } else {
        if (eventStack[eventIndex].event.update(elapsed) && !waitingForAction) nextEvent();
    }

    requestAnimationFrame(ts => update(ts));
}

function nextEvent() {
    if (eventIndex >= (eventStack.length - 1)) return;
    eventIndex++;
    console.log(eventStack[eventIndex]);
}

function keyDown(e) {
    if (binds[e.key] != undefined) {
        if (!binds[e.key].pressed) {
            binds[e.key].pressed = true;
            binds[e.key].exec();
        } else {
            if (speaking) {
                try {
                    eventStack[eventIndex].event.skip();
                } catch (err) {
                    try {
                        eventStack[eventIndex + 1].event.skip();
                    } catch (err) {
                        eventStack[eventIndex + 2].event.skip();
                    }
                }
                speakingSpeedTemp = speakingSpeed;
            }
        }
    }
}

function keyUp(e) {
    if (binds[e.key] != undefined && binds[e.key].pressed) {
        binds[e.key].pressed = false;
        if (speaking) speakingSpeed = speakingSpeedTemp;
    }
}

function getDir(directory) {
    return new Promise((resolve) => {
        var xml = new XMLHttpRequest();
        xml.open("GET", directory, false);
        xml.send(null);
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(xml.responseText, "text/html");
        var list = htmlDoc.querySelector("#files").children;
        var files = [];
        for (i = 1; i < list.length; i++) {
            files.push(list[i].children[0].href);
        }
        resolve(files);
    });
}

function readTextFile(file) {
    return new Promise((resolve, reject) => {
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, false);
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    var allText = rawFile.responseText;
                    return resolve(allText);
                } else reject(new Error("Couldn't read file " + file));
            } else reject(new Error("Couldn't read file " + file));
        }
        rawFile.send(null);
    });
}

function readSoundFile(file) {
    return new Promise((resolve, reject) => {
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, false);
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    return resolve(rawFile);
                } else reject(new Error("Couldn't read file " + file));
            } else reject(new Error("Couldn't read file " + file));
        }
        rawFile.send(null);
    });
}