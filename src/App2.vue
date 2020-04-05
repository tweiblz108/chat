<template>
  <div>
    <h1>Let's Chat!</h1>
    <div class="friend">
      <video ref="friend"></video>
      <div class="me">
        <video ref="me"></video>
      </div>
    </div>
    <hr />
    <!-- <video ref="beauty" controls src="./assets/video.mp4" muted></video> -->
  </div>
</template>

<script>
/* eslint-disable */
import io from "socket.io-client";
import cuid from "cuid";
import * as R from "ramda";

const Connection = {}

export default {
  mounted() {
    const that = this;

    const main = async function() {
      const id = window.location.hash === '' ? 'tweiblz108' : window.location.hash;
      const socket = io("https://mewsq.xyz:38008");

      const getStream = async function() {
        if (id !== "/" && false) {
          const { beauty } = that.$refs;

          return await new Promise(function(resolve) {
            beauty.addEventListener("play", function() {
              resolve(beauty.captureStream());
            });
          });
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });

          return stream;
        }
      };

      const stream = await getStream()

      socket.emit("login", id);
      socket.on("friends", async function(users) {
        // 所有终端都接受 offer
        socket.on("recv-video-offer", async function({ sourceId, sdp }) {
          const connection = new RTCPeerConnection({
            iceServers: [
              {
                urls: "stun:stun.stunprotocol.org"
              }
            ]
          });

          Connection[sourceId] = connection

          connection.onicecandidate = async function({ candidate }) {
            if (candidate) {
              socket.emit("send-ice-candidate", { targetId: sourceId, sourceId: id, candidate });
            }
          };

          connection.ontrack = async function(e) {
              const { friend } = that.$refs;
              friend.srcObject = e.streams[0];
              friend.play();
            }; 

          const desc = new RTCSessionDescription(sdp);
          await connection.setRemoteDescription(desc);

          stream
            .getTracks()
            .forEach(track => connection.addTrack(track, stream));

          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);

          socket.emit("send-video-answer", {
            sourceId: id,
            sdp: connection.localDescription,
            targetId: sourceId // send back the message
          });
        });

        socket.on("recv-video-answer", async function({ sourceId, sdp }) {
          const connection = Connection[sourceId]

          const desc = new RTCSessionDescription(sdp);

          await connection.setRemoteDescription(desc);
        });

        socket.on("recv-ice-candidate", async function({ sourceId, candidate }) {
            const connection = Connection[sourceId]

            const _candidate = new RTCIceCandidate(candidate);

            await connection.addIceCandidate(_candidate);
          });

        if (R.isEmpty(users)) {
          // nothing
        } else {
          users.forEach(function(targetId) {
            console.log(`connection to ${targetId}`);

            const connection = new RTCPeerConnection({
              iceServers: [
                {
                  urls: "stun:stun.stunprotocol.org"
                }
              ]
            });

            Connection[targetId] = connection

            stream
              .getTracks()
              .forEach(track => connection.addTrack(track, stream));

            connection.onnegotiationneeded = async function() {
              const offer = await connection.createOffer();
              await connection.setLocalDescription(offer);

              socket.emit("send-video-offer", {
                sourceId: id,
                targetId,
                sdp: connection.localDescription
              });
            };

            connection.onicecandidate = async function({ candidate }) {
              if (candidate) {
                socket.emit("send-ice-candidate", { targetId, sourceId: id, candidate });
              }
            };

            connection.ontrack = async function(e) {
              const { friend } = that.$refs;
              friend.srcObject = e.streams[0];
              friend.play();
            };            
          });
        }
      });

      const { me } = that.$refs;

      me.srcObject = stream;
      me.play();
    };

    main.call(this);
  }
};
</script>

<style lang="scss" scoped>
video {
  transform: rotateY(180deg);
  width: 100%;
  display: block;
}

.friend {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  background: silver;
}

.me {
  width: 25%;
  position: absolute;
  top: 10px;
  right: 10px;
  border: 3px solid white;
  border-radius: 10px;
  overflow: hidden;
}
</style>