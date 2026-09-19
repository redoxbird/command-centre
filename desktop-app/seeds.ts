// Built-in seed library — task C2.
// 16 distinct design templates (n1..n7 + c1..c9) collapsed to 12 by keeping
// the richer index.html variant of the four pairs (ffmpeg, docker, git-log,
// npm-run). Each seed has a fixed checked-in CVCV id. SHOWCASE's curated
// vars (18 entries) ship as the ffmpeg seed's sidecar metadata.
import type { CommandRow, MetadataDoc, MetaVariable } from "./types.ts";

export interface Seed {
  row: CommandRow;
  metadata: MetadataDoc;
}

function base(id: string, command: string, title: string, description: string, source_folder: string, tags: string[]): Seed {
  return {
    row: { id, command, title, description, source_folder, tags, created_at: 0, updated_at: 0 },
    metadata: {
      app: "command-center",
      kind: "command-metadata",
      version: 2,
      id,
      askMode: "every",
      variables: [],
      values: {},
    },
  };
}

const SHOWCASE_VARS: MetaVariable[] = [
  { key: "input.file", iid: "input.file", occ: 1, total: 2, type: "file", name: "input.file", params: "", auto: false, default: "", token: "{{input.file}}", label: "Main video", description: "Primary video input track.", example: "input.mp4" },
  { key: "input.file", iid: "input.file#2", occ: 2, total: 2, type: "file", name: "input.file", params: "", auto: false, default: "", token: "{{input.file}}", label: "Extra audio", description: "Second input — e.g. an external audio track.", example: "audio.m4a" },
  { key: "input.vcodec:libx264,libx265,vp9,av1=libx264", iid: "input.vcodec:libx264,libx265,vp9,av1=libx264", occ: 1, total: 1, type: "select", name: "input.vcodec", params: "libx264,libx265,vp9,av1=libx264", auto: false, default: "libx264", token: "{{input.vcodec:libx264,libx265,vp9,av1=libx264}}", label: "Video codec", description: "Encoder for the picture track.", options: [{ value: "libx264", label: "H.264", description: "Widely compatible default." }, { value: "libx265", label: "H.265", description: "Better compression, slower." }, { value: "vp9", label: "VP9", description: "Royalty-free web codec." }, { value: "av1", label: "AV1", description: "Next-gen, slowest encode." }], example: "libx264" },
  { key: "input.preset:ultrafast,superfast,veryfast,medium,slow=medium", iid: "input.preset:ultrafast,superfast,veryfast,medium,slow=medium", occ: 1, total: 1, type: "select", name: "input.preset", params: "ultrafast,superfast,veryfast,medium,slow=medium", auto: false, default: "medium", token: "{{input.preset:ultrafast,superfast,veryfast,medium,slow=medium}}", label: "Encoder preset", description: "Speed versus compression trade-off.", options: [{ value: "ultrafast", label: "Ultrafast", description: "Fastest, biggest file." }, { value: "superfast", label: "Superfast", description: "Quick draft encodes." }, { value: "veryfast", label: "Veryfast", description: "Good preview quality." }, { value: "medium", label: "Medium", description: "Balanced default." }, { value: "slow", label: "Slow", description: "Smaller file, slower." }], example: "medium" },
  { key: "input.range:0-51=23", iid: "input.range:0-51=23", occ: 1, total: 1, type: "range", name: "input.range", params: "0-51=23", auto: false, default: "23", token: "{{input.range:0-51=23}}", label: "Quality (CRF)", description: "Lower means better quality, 0 to 51.", example: "23" },
  { key: "input.acodec:aac,mp3,opus,flac=aac", iid: "input.acodec:aac,mp3,opus,flac=aac", occ: 1, total: 1, type: "select", name: "input.acodec", params: "aac,mp3,opus,flac=aac", auto: false, default: "aac", token: "{{input.acodec:aac,mp3,opus,flac=aac}}", label: "Audio codec", description: "Encoder for the sound track.", options: [{ value: "aac", label: "AAC", description: "Default for MP4." }, { value: "mp3", label: "MP3", description: "Universal playback." }, { value: "opus", label: "Opus", description: "Best for streaming." }, { value: "flac", label: "FLAC", description: "Lossless audio." }], example: "aac" },
  { key: "input.bitrate:192", iid: "input.bitrate:192", occ: 1, total: 1, type: "number", name: "input.bitrate", params: "192", auto: false, default: "192", token: "{{input.bitrate:192}}", label: "Audio bitrate", description: "Kilobits per second.", example: "192" },
  { key: "input.samplerate:44100,48000=44100", iid: "input.samplerate:44100,48000=44100", occ: 1, total: 1, type: "select", name: "input.samplerate", params: "44100,48000=44100", auto: false, default: "44100", token: "{{input.samplerate:44100,48000=44100}}", label: "Sample rate", description: "Audio samples per second.", options: [{ value: "44100", label: "44.1 kHz", description: "CD quality." }, { value: "48000", label: "48 kHz", description: "Video standard." }], example: "44100" },
  { key: "input.channels:1,2,6=2", iid: "input.channels:1,2,6=2", occ: 1, total: 1, type: "select", name: "input.channels", params: "1,2,6=2", auto: false, default: "2", token: "{{input.channels:1,2,6=2}}", label: "Channels", description: "Audio channel layout.", options: [{ value: "1", label: "Mono", description: "Single channel." }, { value: "2", label: "Stereo", description: "Default two channels." }, { value: "6", label: "5.1", description: "Surround sound." }], example: "2" },
  { key: "input.fps:30", iid: "input.fps:30", occ: 1, total: 1, type: "number", name: "input.fps", params: "30", auto: false, default: "30", token: "{{input.fps:30}}", label: "Frame rate", description: "Frames per second.", example: "30" },
  { key: "input.resolution:1920x1080,1280x720,640x480=1280x720", iid: "input.resolution:1920x1080,1280x720,640x480=1280x720", occ: 1, total: 1, type: "select", name: "input.resolution", params: "1920x1080,1280x720,640x480=1280x720", auto: false, default: "1280x720", token: "{{input.resolution:1920x1080,1280x720,640x480=1280x720}}", label: "Frame size", description: "Output picture dimensions.", options: [{ value: "1920x1080", label: "Full HD", description: "1920 by 1080." }, { value: "1280x720", label: "HD", description: "Default web size." }, { value: "640x480", label: "Small", description: "Lightweight preview." }], example: "1280x720" },
  { key: "input.checkbox:+faststart", iid: "input.checkbox:+faststart", occ: 1, total: 1, type: "checkbox", name: "input.checkbox", params: "+faststart", auto: false, default: "+faststart", token: "{{input.checkbox:+faststart}}", label: "Fast start", description: "Move metadata first for streaming.", example: "+faststart" },
  { key: "input.hexcolor:#ffffff", iid: "input.hexcolor:#ffffff", occ: 1, total: 1, type: "color", name: "input.hexcolor", params: "#ffffff", auto: false, default: "#ffffff", token: "{{input.hexcolor:#ffffff}}", label: "Subtitle color", description: "Font color for burned-in subtitles.", example: "#ffffff" },
  { key: "input.range:0-100=90", iid: "input.range:0-100=90", occ: 1, total: 1, type: "range", name: "input.range", params: "0-100=90", auto: false, default: "90", token: "{{input.range:0-100=90}}", label: "Volume", description: "Audio level, 0 to 100.", example: "90" },
  { key: "input.date:2026-01-15", iid: "input.date:2026-01-15", occ: 1, total: 1, type: "date", name: "input.date", params: "2026-01-15", auto: false, default: "2026-01-15", token: "{{input.date:2026-01-15}}", label: "Creation date", description: "Stamped into the file metadata.", example: "2026-01-15" },
  { key: "input.uuid.autogenerate", iid: "input.uuid.autogenerate", occ: 1, total: 1, type: "text", name: "input.uuid", params: "", auto: true, default: "", token: "{{input.uuid.autogenerate}}", label: "Run ID (auto)", description: "Unique id tagged on this encode — still editable.", example: "7c9e6679-7425-40de-944b-e07fc1f90ae7" },
  { key: "input.output:final.mp4", iid: "input.output:final.mp4", occ: 1, total: 1, type: "file", name: "input.output", params: "final.mp4", auto: false, default: "final.mp4", token: "{{input.output:final.mp4}}", label: "Output file", description: "Finished video written here.", example: "final.mp4" },
  { key: "input.checkbox:--dry-run=off", iid: "input.checkbox:--dry-run=off", occ: 1, total: 1, type: "checkbox", name: "input.checkbox", params: "--dry-run", auto: false, default: "--dry-run", token: "{{input.checkbox:--dry-run=off}}", label: "Dry run", description: "Print the command without running it.", example: "" },
];

const ffmpeg = base(
  "sami-siru-sona",
  "ffmpeg -i {{input.file}} -i {{input.file}} -c:v {{input.vcodec:libx264,libx265,vp9,av1=libx264}} -preset {{input.preset:ultrafast,superfast,veryfast,medium,slow=medium}} -crf {{input.range:0-51=23}} -c:a {{input.acodec:aac,mp3,opus,flac=aac}} -b:a {{input.bitrate:192}}k -ar {{input.samplerate:44100,48000=44100}} -ac {{input.channels:1,2,6=2}} -r {{input.fps:30}} -s {{input.resolution:1920x1080,1280x720,640x480=1280x720}} -movflags {{input.checkbox:+faststart}} -fontcolor {{input.hexcolor:#ffffff}} -volume {{input.range:0-100=90}} -metadata creation_time={{input.date:2026-01-15}} -metadata run_id={{input.uuid.autogenerate}} -y {{input.output:final.mp4}} {{input.checkbox:--dry-run=off}}",
  "Convert video to streaming MP4",
  "Full-feature ffmpeg demo: repeated inputs, codecs, quality, defaults, autogenerate and flags.",
  "C:\\projects\\media",
  ["video"],
);
ffmpeg.metadata.variables = SHOWCASE_VARS;

export const DEFAULT_COMMANDS: Seed[] = [
  ffmpeg,
  base("bode-femi-luna", "deno run -A --src {{input.dir}} --dest {{input.dir}} --format {{input.select:zip,tar.gz=tar.gz}} --id {{input.uuid.autogenerate}}", "Ship a release bundle", "Source and destination stay separate — each {{input.dir}} gets its own value.", "C:\\projects\\shop-app", ["ship"]),
  base("karo-miso-tuve", "docker run {{input.checkbox:--rm}} -p {{input.port:8080}}:80 --name {{input.text:web}} {{input.image:nginx,caddy,httpd=nginx}}", "Run container (ports & image)", "Start a web server container with your port, name and image.", "C:\\projects\\shop-app", ["ship"]),
  base("gali-nore-pisu", "git log --since={{input.date:2026-01-15}} --pretty={{input.logformat:oneline,short,full=oneline}} -{{input.count:5}}", "Browse history since a date", "Readable commit history from a date, in your format.", "C:\\projects\\shop-app", ["git"]),
  base("bina-zelo-maru", "npm run preview -- --accent={{input.color:#1677ff}} --since={{input.date:2026-01-15}} --token={{input.password.autogenerate}}", "Brand a preview page", "Preview with a brand color, a since-date and a generated token.", "C:\\projects\\shop-app", ["develop"]),
  base("nima-pore-satu", "npm run {{input.select:dev,build,test,lint}} -- --mode={{input.radio:development,production=production}} {{input.checkbox:--watch}} {{input.checkbox:--dry-run=off}}", "Run script with mode", "Run a package script with mode and flags.", "C:\\projects\\shop-app", ["develop"]),
  base("soru-dani-pevo", 'ssh {{input.username:deployer}}@{{input.hostname:web-01}} "docker run -d --name {{input.text:preview}}-{{input.uuid.autogenerate}} -p {{input.port:8080}}:80 {{input.image:nginx,caddy=nginx}}"', "Provision preview environment", "SSH to a host and start a preview container.", "C:\\projects\\shop-app", ["ship"]),
  base("nile-sapo-wigu", "npm install", "Install dependencies", "Clean install from lockfile before starting work.", "C:\\projects\\shop-app", ["setup"]),
  base("devo-sire-hanu", "npm run dev", "Run dev server", "Start Vite dev server with hot reload.", "C:\\projects\\shop-app", ["develop"]),
  base("tese-rimu-nola", "npm test -- --watchAll=false", "Run tests", "Full Jest suite, CI mode, no watch.", "C:\\projects\\shop-app\\tests", ["test"]),
  base("buli-duro-pema", "npm run build", "Build for production", "Typecheck + bundle to dist/ for release.", "C:\\projects\\shop-app", ["ship"]),
  base("gisu-tano-remi", "git status --short --branch", "Git status", "Short status with branch info.", "C:\\projects\\shop-app", ["git"]),
];
