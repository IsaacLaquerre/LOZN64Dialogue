class SoundFile {
    constructor(path) {
        this.path = path;
        this.audio = new Audio(path);
        this.ended = false;
        this.audio.onended = () => { this.ended = true; }
    }

    play() {
        this.audio.play();
    }

    fadeIn() {
        var fadeIn = setInterval(() => {
            if (this.audio.volume >= 1) {
                clearInterval(fadeIn);
                return this.audio.volume = 1;
            }
            this.audio.volume += 0.0001;
            this.audio.volume = this.audio.volume.toFixed(4);
        }, 1);
    }

    fadeOut() {
        var fadeOut = setInterval(() => {
            if (this.audio.volume.toFixed(4) <= 0) {
                clearInterval(fadeOut);
                return this.audio.remove();
            }
            this.audio.volume -= 0.0001;
            this.audio.volume = this.audio.volume.toFixed(4);
        }, 1);
    }
}