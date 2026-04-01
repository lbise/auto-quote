import { useCallback, useRef, useState } from "react"

import { transcribeAudio } from "@/lib/api"

export type VoiceRecorderState = "idle" | "recording" | "transcribing" | "error"

export type UseVoiceRecorderOptions = {
  /** Language hint sent to the transcription backend (e.g. "fr", "en"). */
  language?: string
  /** Called with the transcript text on success. */
  onTranscript: (text: string) => void
  /** Max recording duration in milliseconds. Defaults to 120_000 (2 min). */
  maxDurationMs?: number
}

export type UseVoiceRecorderReturn = {
  state: VoiceRecorderState
  /** Whether the browser supports MediaRecorder + getUserMedia. */
  supported: boolean
  /** Start recording. Requests mic permission if needed. */
  start: () => void
  /** Stop recording and trigger transcription. */
  stop: () => void
  /** Cancel an active recording without transcribing. */
  cancel: () => void
  /** Error message when state is "error", otherwise null. */
  error: string | null
  /** Recording elapsed time in seconds (updates every second while recording). */
  elapsed: number
}

export function useVoiceRecorder({
  language,
  onTranscript,
  maxDurationMs = 120_000,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [state, setState] = useState<VoiceRecorderState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const supported =
    typeof navigator !== "undefined" &&
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current)
      maxTimerRef.current = null
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [])

  const processRecording = useCallback(
    async (blob: Blob) => {
      if (blob.size === 0) {
        setState("error")
        setError("voice.errors.empty")
        cleanup()
        return
      }

      setState("transcribing")
      setError(null)

      try {
        const response = await transcribeAudio(blob, language)
        const text = response.text.trim()

        if (!text) {
          setState("error")
          setError("voice.errors.emptyTranscript")
          return
        }

        onTranscript(text)
        setState("idle")
        setError(null)
        setElapsed(0)
      } catch (err) {
        setState("error")
        setError(
          err instanceof Error && err.message
            ? err.message
            : "voice.errors.transcriptionFailed"
        )
      } finally {
        cleanup()
      }
    },
    [cleanup, language, onTranscript]
  )

  const start = useCallback(() => {
    if (!supported) {
      setState("error")
      setError("voice.errors.unsupported")
      return
    }

    if (state === "recording" || state === "transcribing") {
      return
    }

    setState("idle")
    setError(null)
    setElapsed(0)
    chunksRef.current = []

    void navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream

        // Prefer opus codecs; try webm first (Chrome), then ogg (Firefox), then bare containers, then browser default.
        const mimePreference = [
          "audio/webm;codecs=opus",
          "audio/ogg;codecs=opus",
          "audio/webm",
          "audio/ogg",
        ]
        const mimeType = mimePreference.find((m) => MediaRecorder.isTypeSupported(m)) ?? ""

        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
        mediaRecorderRef.current = recorder

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data)
          }
        }

        recorder.onstop = () => {
          // Use the actual MIME type negotiated by the recorder, not our requested one.
          const actualMime = recorder.mimeType || mimeType
          const blob = new Blob(chunksRef.current, {
            type: actualMime || "audio/webm",
          })
          void processRecording(blob)
        }

        recorder.onerror = () => {
          setState("error")
          setError("voice.errors.recordingFailed")
          cleanup()
        }

        recorder.start(250) // collect data every 250ms
        setState("recording")

        // Elapsed timer
        const startTime = Date.now()
        timerRef.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - startTime) / 1000))
        }, 1000)

        // Auto-stop at max duration
        maxTimerRef.current = setTimeout(() => {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop()
          }
        }, maxDurationMs)
      })
      .catch((err) => {
        setState("error")
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setError("voice.errors.permissionDenied")
        } else {
          setError("voice.errors.micUnavailable")
        }
        cleanup()
      })
  }, [cleanup, maxDurationMs, processRecording, state, supported])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const cancel = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      // Detach the onstop handler so processRecording is not called.
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
    }
    cleanup()
    setState("idle")
    setError(null)
    setElapsed(0)
  }, [cleanup])

  return { state, supported, start, stop, cancel, error, elapsed }
}
