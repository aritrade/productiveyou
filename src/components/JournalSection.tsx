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
        setAudioUrl(URL.createObjectURL(blob));
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
    <div className="card-section p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-focus/15 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-focus" />
        </div>
        <h2 className="text-sm font-heading font-semibold tracking-widest uppercase text-gradient-blue">
          Daily Journal
        </h2>
      </div>

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How was your day? What did you learn? What are you grateful for?"
          className="input-field h-28 resize-none"
        />

        {audioUrl && (
          <audio controls src={audioUrl} className="w-full h-10 rounded-lg" />
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 ${
              isRecording
                ? "btn-primary animate-pulse"
                : "btn-secondary"
            }`}
            style={isRecording ? { background: "hsl(0 78% 55%)" } : undefined}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isRecording ? "Stop" : "Record Audio"}
          </button>

          <button
            onClick={handleSave}
            disabled={!text.trim() && !audioUrl}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Entry
          </button>
        </div>

        {entries.length > 0 && (
          <div className="mt-4 space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-[10px] text-muted-foreground mb-2 font-heading tracking-wider uppercase">
                  {entry.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                {entry.text && <p className="text-sm text-foreground/85 leading-relaxed">{entry.text}</p>}
                {entry.audioUrl && <audio controls src={entry.audioUrl} className="w-full h-8 mt-2" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalSection;
