import { useState, useRef } from "react";
import { BookOpen, Mic, MicOff, Save, ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface JournalEntry {
  id: string;
  text: string;
  audioUrl?: string;
  photos?: { url: string; caption: string }[];
  timestamp: Date;
}

interface Props {
  entries: JournalEntry[];
  onSave: (entry: { text: string; audioUrl?: string; photos?: { url: string; caption: string }[] }) => void;
}

interface PhotoDraft {
  file: File;
  preview: string;
  caption: string;
}

const JournalSection = ({ entries, onSave }: Props) => {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos: PhotoDraft[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "",
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, caption } : p)));
  };

  const uploadPhotos = async (): Promise<{ url: string; caption: string }[]> => {
    const uploaded: { url: string; caption: string }[] = [];
    for (const photo of photos) {
      const ext = photo.file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("journal-photos")
        .upload(path, photo.file, { contentType: photo.file.type });
      if (error) {
        console.error("Photo upload failed:", error);
        continue;
      }
      const { data: urlData } = supabase.storage.from("journal-photos").getPublicUrl(path);
      uploaded.push({ url: urlData.publicUrl, caption: photo.caption });
    }
    return uploaded;
  };

  const handleSave = async () => {
    if (!text.trim() && !audioUrl && photos.length === 0) return;
    setUploading(true);
    try {
      let uploadedPhotos: { url: string; caption: string }[] = [];
      if (photos.length > 0) {
        uploadedPhotos = await uploadPhotos();
      }
      onSave({
        text: text.trim(),
        audioUrl,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
      });
      setText("");
      setAudioUrl(undefined);
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos([]);
    } finally {
      setUploading(false);
    }
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

        {/* Photo drafts */}
        {photos.length > 0 && (
          <div className="space-y-3">
            {photos.map((photo, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                <div className="relative">
                  <img
                    src={photo.preview}
                    alt={`Draft ${idx + 1}`}
                    className="w-full max-h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-destructive/80 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-foreground" />
                  </button>
                </div>
                <input
                  type="text"
                  value={photo.caption}
                  onChange={(e) => updateCaption(idx, e.target.value)}
                  placeholder="Write something about this photo..."
                  className="input-field text-xs py-2"
                />
              </div>
            ))}
          </div>
        )}

        {audioUrl && (
          <audio controls src={audioUrl} className="w-full h-10 rounded-lg" />
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddPhoto}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center gap-2 text-xs"
          >
            <ImagePlus className="h-4 w-4" />
            Add Photos
          </button>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 text-xs ${
              isRecording ? "btn-primary animate-pulse" : "btn-secondary"
            }`}
            style={isRecording ? { background: "hsl(0 78% 55%)" } : undefined}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isRecording ? "Stop" : "Record"}
          </button>

          <button
            onClick={handleSave}
            disabled={(!text.trim() && !audioUrl && photos.length === 0) || uploading}
            className="btn-primary flex items-center gap-2 text-xs ml-auto"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {uploading ? "Uploading..." : "Save Entry"}
          </button>
        </div>

        {entries.length > 0 && (
          <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                <p className="text-[10px] text-muted-foreground font-heading tracking-wider uppercase">
                  {entry.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                {entry.text && <p className="text-sm text-foreground/85 leading-relaxed">{entry.text}</p>}
                {entry.photos && entry.photos.length > 0 && (
                  <div className="space-y-2">
                    {entry.photos.map((photo, idx) => (
                      <div key={idx} className="space-y-1">
                        <img
                          src={photo.url}
                          alt={photo.caption || `Photo ${idx + 1}`}
                          className="w-full max-h-40 object-cover rounded-lg"
                        />
                        {photo.caption && (
                          <p className="text-xs text-muted-foreground italic px-1">{photo.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {entry.audioUrl && <audio controls src={entry.audioUrl} className="w-full h-8 mt-1" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalSection;
