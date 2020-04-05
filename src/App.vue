<template>
  <div>
    <div>Let's Chat!</div>
    <video v-show="streaming" @canplay="initCanvas" ref="video"></video>
    <img v-show="!streaming" src="./assets/avatar.jpg" alt />
    <button @click="capture">Capture</button>
    <button @click="stopStreaming">stop</button>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
export default {
  data() {
    return {
      streaming: false
    };
  },

  methods: {
    initCanvas() {
      if (!this.streaming) {
        const { video, canvas } = this.$refs;

        canvas.setAttribute("width", video.getAttribute("width"));
        canvas.setAttribute("height", video.getAttribute("height"));

        this.streaming = true;
      }
    },

    capture() {
      const { canvas, video } = this.$refs;
      const context = canvas.getContext("2d");

      context.drawImage(video, 0, 0, 100, 200);
    },

    stopStreaming () {
      this.$refs.video.srcObject.getTracks()[0].stop();
    }
  },

  created() {
    (async () => {
      try {
        const steam = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        this.$refs.video.srcObject = steam;
        this.$refs.video.play();
      } catch (error) {
        console.log(error);
      }
    })();
  }
};
</script>

<style lang="scss" scoped>
video {
  transform: rotateY(180deg);
  width: 100%;
}

img {
  width: 100%;
}
</style>