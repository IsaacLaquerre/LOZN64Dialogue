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
}