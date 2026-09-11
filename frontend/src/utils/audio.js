/**
 * Play a synthesized, pleasant restaurant notification chime using Web Audio API.
 * Major chord: E5 (659Hz) -> G#5 (830Hz) -> B5 (988Hz)
 */
export const playOrderNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()

    // Resumes audio context if browser suspended it due to autoplay policy
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const notes = [
      { freq: 659.25, time: 0, duration: 0.35, gain: 0.25 },   // E5
      { freq: 830.61, time: 0.12, duration: 0.4, gain: 0.25 }, // G#5
      { freq: 987.77, time: 0.24, duration: 0.6, gain: 0.3 },  // B5
    ]

    notes.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time)

      gainNode.gain.setValueAtTime(0.001, ctx.currentTime + time)
      gainNode.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + time + 0.04)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration)

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start(ctx.currentTime + time)
      osc.stop(ctx.currentTime + time + duration)
    })
  } catch (e) {
    // Audio contexts may be blocked if no user interaction occurred yet; gracefully fail
  }
}
