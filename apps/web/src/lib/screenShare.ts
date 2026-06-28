import { ws } from './ws'

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

class ScreenShareService {
  localStream: MediaStream | null = null
  private pcs = new Map<string, RTCPeerConnection>()
  private onRemoteStream: ((userId: string, stream: MediaStream | null) => void) | null = null

  setRemoteStreamHandler(fn: (userId: string, stream: MediaStream | null) => void) {
    this.onRemoteStream = fn
  }

  async start(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: true,
    })
    // Stop sharing if user dismisses the browser picker
    this.localStream.getVideoTracks()[0].onended = () => {
      this.stop()
    }
    return this.localStream
  }

  stop() {
    this.localStream?.getTracks().forEach(t => t.stop())
    this.localStream = null
    this.pcs.forEach((pc, uid) => {
      pc.close()
      this.onRemoteStream?.(uid, null)
    })
    this.pcs.clear()
  }

  /** Sharer: create an offer for a peer who wants to view */
  async offer(peerId: string) {
    const pc = this._makePc(peerId)
    this.localStream?.getTracks().forEach(t => pc.addTrack(t, this.localStream!))
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    ws.screenShareOffer(peerId, offer.sdp!)
  }

  /** Viewer: received an offer from the sharer, send back answer */
  async answer(sharerId: string, offerSdp: string) {
    const pc = this._makePc(sharerId)
    pc.ontrack = (e) => {
      const stream = e.streams[0] ?? new MediaStream([e.track])
      this.onRemoteStream?.(sharerId, stream)
    }
    await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp })
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    ws.screenShareAnswer(sharerId, answer.sdp!)
  }

  /** Sharer: received answer from viewer */
  async handleAnswer(viewerId: string, answerSdp: string) {
    const pc = this.pcs.get(viewerId)
    if (!pc) return
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
  }

  /** Both sides: add received ICE candidate */
  async addIce(peerId: string, candidate: RTCIceCandidateInit) {
    const pc = this.pcs.get(peerId)
    if (!pc) return
    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)) } catch { /* ignore */ }
  }

  closePeer(peerId: string) {
    this.pcs.get(peerId)?.close()
    this.pcs.delete(peerId)
    this.onRemoteStream?.(peerId, null)
  }

  private _makePc(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    this.pcs.set(peerId, pc)
    pc.onicecandidate = (e) => {
      if (e.candidate) ws.iceCandidate(peerId, e.candidate.toJSON())
    }
    return pc
  }
}

export const screenShare = new ScreenShareService()
