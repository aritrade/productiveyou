import { useState, useRef } from "react";
import { BookOpen, Mic, MicOff, Save } from "lucide-react";

interface JournalEntry {
  id: string;
  text: string;
  audioUrl?: string;
  timestamp: Date;
}

interface Props {
  entries: JournalEntry[];
  onSave: (entry: { text: string; audioUrl?: string }) => void;
}

const JournalSection = ({ entries, onSave }: Props) => {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSave = () => {
    if (!text.trim() && !audioUrl) return;
    onSave({ text: text.trim(), audioUrl });
    setText("");
    setAudioUrl(undefined);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 card-glow">
      <div className="flex items-center gap-3 mb-5">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-lg font-heading font-semibold tracking-wide uppercase text-gradient">
          Daily Journal
        </h2>
      </div>

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How was your day? What did you learn? What are you grateful for?"
          className="w-full h-28 rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />

        {audioUrl && (
          <audio controls src={audioUrl} className="w-full h-10 rounded-lg" />
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              isRecording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isRecording ? "Stop Recording" : "Record Audio"}
          </button>

          <button
            onClick={handleSave}
            disabled={!text.trim() && !audioUrl}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Save Entry
          </button>
        </div>

        {entries.length > 0 && (
          <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-border bg-muted/50 p-4"
              >
                <p className="text-xs text-muted-foreground mb-2 font-heading">
                  {entry.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                {entry.text && <p className="text-sm text-foreground">{entry.text}</p>}
                {entry.audioUrl && (
                  <audio controls src={entry.audioUrl} className="w-full h-8 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalSection;
