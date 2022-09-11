var noPauseCharacters = [" ", "?", "!", "-"];
var smallPauseCharacters = [".", ","];

class BackgroudEvent {
    constructor(background) {
        this.background = background;
    }

    update() {
        currentBackground = this.background;
        document.querySelector("#frame").style.backgroundImage = "url(\"" + this.background + "\")";
        return true;
    }
}

class AudioEvent {
    constructor(type, soundfile, volume = 1) {
        this.type = type;
        this.soundfile = soundfile;
        this.soundfile.audio.volume = volume;
        this.played = false;
    }

    update() {
        if (!this.played) {
            if (currentMusic != undefined) {
                currentMusic.fadeOut();
            }
            currentMusic = this.soundfile;
            this.soundfile.play();
            this.played = true;
        }
        if (this.soundfile.ended) {
            if (this.type === "MUSIC") currentMusic = undefined;
            return true;
        }
        if (this.type === "MUSIC") return true;
    }
}

class SyncEvent {
    constructor() {}

    update() {
        return true;
    }
}

class WaitEvent {
    constructor(ms) {
        this.ms = ms;
        this.start = 0;
    }

    update(ts) {
        this.start = this.start + ts;
        if (this.start >= this.ms) return true;
        else return false;
    }
}

class SpeakEvent {
    constructor(text) {
        this.text = text;
        this.type = "SPEAK";

        this.dialogueText = document.querySelector("#dialogueText");
        this.speed = speakingSpeed;
        this.skipped = false;
        this.textIndex = 0;
        this.lastTs = 0;
        this.color = "white";
        this.coloring = false;
        this.newLines = 0;
    }

    skip() {
        this.skipped = true;
    }

    doneSpeaking() {
        speaking = false;
        var square = document.createElement("div");
        square.classList.add("dialogueSquare");
        document.querySelector("#dialogueBox").appendChild(square);
        sfx.DialogueDone.play();
        waitingForAction = true;
        doNext = () => {
            square.remove();
            document.querySelector("#dialogueText").innerHTML = "";
            waitingForAction = false;
        };
    }

    update(ts) {
        if (this.textIndex >= this.text.length) {
            if (speaking) this.doneSpeaking();
            return true;
        } else speaking = true;

        if (document.querySelector("#dialogueBox").style.opacity == 0) document.querySelector("#dialogueBox").style.opacity = 1;

        if (this.skipped) {
            if (this.text.indexOf("${") != -1) {
                var texts = this.text.split(/\$\{[#1234567890(),ABCDEFabcdefghijklmnopqrstuvwxyz]+\}/).filter(text => text != "");
                var colors = this.text.match(/((\$\{[#1234567890(),ABCDEFabcdefghijklmnopqrstuvwxyz]+\}))/g);

                var text = "";

                for (i in texts) {
                    if (colors[i] != undefined && colors[i] != colors[i - 1]) {
                        text += "<span style='color: " + colors[i].replace(/\$\{/g, "").replace(/\}/g, "") + ";'>" + texts[i] + (colors[i] == colors[i + 1] ? "" : "</span>");
                    } else {
                        text += texts[i];
                    }
                }

                this.text = text;
            }
            if (this.text.indexOf("&{NEWLINE}") != -1) {
                texts = this.text.split(/\&\{NEWLINE\}/).filter(text => text != "");
                if (texts.length > 3) texts = texts.slice(0, 4);

                text = "";

                for (i in texts) {
                    text += texts[i].replace(/\&\{NEWLINE\}/g, "") + "<br/>";
                }

                this.text = text;
            }
            this.dialogueText.innerHTML = this.text.replace(/\%\{[0123456789default]+\}/g, "");
            this.textIndex = this.text.length;
        } else {

            if (speakingSpeed <= this.lastTs) {

                speakingSpeed = this.speed;

                if (this.text[this.textIndex] === "$" && this.text[this.textIndex + 1] === "{") {
                    var preIndex = this.textIndex + 1;
                    var searchIndex = preIndex + this.text.substring(preIndex).indexOf("}");
                    var color = this.text.substring(this.textIndex + 2, searchIndex);
                    this.color = color;
                    this.coloring = true;
                }

                if (noPauseCharacters.includes(this.text[this.textIndex])) {
                    if ((this.text[this.textIndex + 1] === "$" && this.text[this.textIndex + 2] === "{") || this.text.substring(this.textIndex + 1, this.textIndex + 11) === "&{NEWLINE}" || (this.text[this.textIndex + 1] === "%" && this.text[this.textIndex + 2] === "{")) {
                        this.dialogueText.innerHTML += this.text[this.textIndex];
                    } else {
                        if (this.text[this.textIndex + 1] != undefined) {
                            this.dialogueText.innerHTML += this.text[this.textIndex] + (this.coloring ? "<span style='color: " + this.color + ";'>" + this.text[this.textIndex + 1] + "</span>" : this.text[this.textIndex + 1]);
                        } else {
                            this.dialogueText.innerHTML += this.text[this.textIndex];
                        }
                        this.textIndex++;
                    }
                } else if (smallPauseCharacters.includes(this.text[this.textIndex])) {
                    this.dialogueText.innerHTML += (this.coloring ? "<span style='color: " + this.color + ";'>" + this.text[this.textIndex] + "</span>" : this.text[this.textIndex]);
                    speakingSpeed = this.speed * 8;
                } else {
                    if (this.text[this.textIndex] === "$" && this.text[this.textIndex + 1] === "{" && this.coloring) {
                        this.textIndex += this.color.length + 2;
                    } else if (this.text[this.textIndex] === "}" && this.coloring) {
                        this.coloring = false;
                    } else if (this.text.substring(this.textIndex, this.textIndex + 10) === "&{NEWLINE}") {
                        if (this.newLines < 3) {
                            this.dialogueText.innerHTML += "<br/>";
                            this.textIndex += 9;
                            this.newLines++;
                        } else this.textIndex = this.text.length;
                    } else if (this.text[this.textIndex] === "%" && this.text[this.textIndex + 1] === "{") {
                        var speed = this.text.substring(this.textIndex + 2, this.textIndex + this.text.substring(this.textIndex).indexOf("}"));
                        this.textIndex += speed.length + 2;
                        if (speed.toLowerCase() === "default") speed = 60;
                        this.speed = speed;
                    } else {
                        this.dialogueText.innerHTML += (this.coloring ? "<span style='color: " + this.color + ";'>" + this.text[this.textIndex] + "</span>" : this.text[this.textIndex]);
                    }
                }

                this.lastTs = 0;
                this.textIndex++;
            } else this.lastTs += ts * 2;
        }

        return false;
    }
}

class DialogueBoxEvent {
    constructor(type) {
        this.type = type;
    }

    update() {
        switch (this.type) {
            case "HIDE":
                if (document.querySelector("#dialogueBox").style.opacity != 0) document.querySelector("#dialogueBox").style.opacity = 0;
                break;
            case "SHOW":
                if (document.querySelector("#dialogueBox").style.opacity == 0) document.querySelector("#dialogueBox").style.opacity = 1;
                break;
            default:
                break;
        }

        return true;
    }
}