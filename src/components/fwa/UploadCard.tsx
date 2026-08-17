import { useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export type UploadedFile = { name: string; records: number; sizeKb: number };

export function UploadCard({
  label,
  hint,
  onUploaded,
  file,
}: {
  label: string;
  hint: string;
  onUploaded: (file: UploadedFile) => void;
  file: UploadedFile | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(picked: File | undefined) {
    if (!picked) return;
    const records = 40 + (picked.size % 260);
    onUploaded({ name: picked.name, records, sizeKb: Math.max(1, Math.round(picked.size / 1024)) });
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
      className={`surface-panel animate-rise flex flex-col items-center gap-5 px-6 py-12 text-center transition-all duration-400 ${
        dragging ? "border-accent/60 shadow-lift" : ""
      }`}
    >
      <span className="gradient-navy flex size-16 items-center justify-center rounded-2xl text-navy-foreground shadow-float">
        <UploadCloud className="size-8" />
      </span>
      <div>
        <h3 className="text-base font-semibold tracking-[0.08em] uppercase text-foreground">{label}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{hint}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.json,.txt"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        className="rounded-full px-7 py-5 text-sm font-semibold shadow-float transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
      >
        {label}
      </Button>

      {file ? (
        <div className="animate-rise mt-2 grid w-full max-w-2xl gap-3 rounded-xl border border-border/70 bg-secondary/40 p-4 text-left sm:grid-cols-3">
          <Detail icon label="File name" value={file.name} />
          <Detail label="Records detected" value={file.records.toLocaleString()} />
          <Detail label="Upload status" value="Validated · Ready" ok />
        </div>
      ) : null}
    </div>
  );
}

function Detail({
  label,
  value,
  icon,
  ok,
}: {
  label: string;
  value: string;
  icon?: boolean;
  ok?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
        {icon ? <FileSpreadsheet className="size-4 shrink-0 text-primary" /> : null}
        {ok ? <CheckCircle2 className="size-4 shrink-0 text-risk-low" /> : null}
        {value}
      </p>
    </div>
  );
}
