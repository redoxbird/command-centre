// Command Centre input-type registry — single source of truth.
// Live table (30 rows) + retired read-tolerance table (108 rows) + 7 aliases,
// transcribed verbatim from design/add.html (identical arrays ship in
// design/index.html and design/command.html; hub.html defines none).
//
// RULES.md: unknown input.* names stay literal — lookupType returns null
// for truly unknown names. Retired names parse (flagged retired:true) but
// are never offered in autocomplete or the Learn reference.

export type TypeRow = readonly [name: string, widget: string, label: string, defaultParams?: string];

export const CC_INPUT_TYPES: readonly TypeRow[] = [
  ["input.file", "file", "File path"],
  ["input.dir", "file", "Directory path"],
  ["input.files", "file", "Multiple files (space-separated)"],
  ["input.text", "text", "Free text"],
  ["input.email", "text", "Email address"],
  ["input.url", "text", "URL"],
  ["input.search", "text", "Search string"],
  ["input.uuid", "text", "UUID v4"],
  ["input.number", "number", "Numeric value"],
  ["input.port", "number", "Port number"],
  ["input.date", "date", "Calendar date"],
  ["input.color", "color", "Color swatch (hex)"],
  ["input.password", "password", "Masked secret"],
  ["input.select", "select", "Choice list", "mp4,mkv,mov"],
  ["input.radio", "radio", "Single choice", "yes,no"],
  ["input.buttongroup", "buttongroup", "Button group (single choice)", "fast,medium,slow"],
  ["input.country", "select", "Country code", "US,GB,DE,FR,ES,IN,JP,BR,CA,AU,AF,AX,AL,DZ,AS,AD,AO,AI,AQ,AG,AR,AM,AW,AT,AZ,BS,BH,BD,BB,BY,BE,BZ,BJ,BM,BT,BO,BQ,BA,BW,BV,IO,BN,BG,BF,BI,KH,CM,CV,KY,CF,TD,CL,CN,CX,CC,CO,KM,CG,CD,CK,CR,CI,HR,CU,CW,CY,CZ,DK,DJ,DM,DO,EC,EG,SV,GQ,ER,EE,SZ,ET,FK,FO,FJ,FI,GF,PF,TF,GA,GM,GE,GH,GI,GR,GL,GD,GP,GU,GT,GG,GN,GW,GY,HT,HM,VA,HN,HK,HU,IS,ID,IR,IQ,IE,IM,IL,IT,JM,JE,JO,KZ,KE,KI,KP,KR,KW,KG,LA,LV,LB,LS,LR,LY,LI,LT,LU,MO,MG,MW,MY,MV,ML,MT,MH,MQ,MR,MU,YT,MX,FM,MD,MC,MN,ME,MS,MA,MZ,MM,NA,NR,NP,NL,NC,NZ,NI,NE,NG,NU,NF,MK,MP,NO,OM,PK,PW,PS,PA,PG,PY,PE,PH,PN,PL,PT,PR,QA,RE,RO,RU,RW,BL,SH,KN,LC,MF,PM,VC,WS,SM,ST,SA,SN,RS,SC,SL,SG,SX,SK,SI,SB,SO,ZA,GS,SS,LK,SD,SR,SJ,SE,CH,SY,TW,TJ,TZ,TH,TL,TG,TK,TO,TT,TN,TR,TM,TC,TV,UG,UA,AE,UM,UY,UZ,VU,VE,VN,VG,VI,WF,EH,YE,ZM,ZW"],
  ["input.timezone", "select", "Timezone", "UTC,America/New_York,America/Chicago,America/Denver,America/Los_Angeles,America/Anchorage,Pacific/Honolulu,America/Toronto,America/Vancouver,America/Mexico_City,America/Sao_Paulo,America/Buenos_Aires,Atlantic/Azores,Europe/London,Europe/Paris,Europe/Berlin,Europe/Rome,Europe/Madrid,Europe/Amsterdam,Europe/Zurich,Europe/Stockholm,Europe/Athens,Europe/Istanbul,Europe/Moscow,Africa/Cairo,Africa/Lagos,Africa/Johannesburg,Africa/Nairobi,Asia/Dubai,Asia/Karachi,Asia/Kolkata,Asia/Dhaka,Asia/Bangkok,Asia/Singapore,Asia/Hong_Kong,Asia/Shanghai,Asia/Tokyo,Asia/Seoul,Australia/Perth,Australia/Sydney,Pacific/Auckland"],
  ["input.currency", "select", "Currency", "USD,EUR,GBP,JPY,CHF,CAD,AUD,CNY,SEK,NZD,MXN,SGD,HKD,NOK,KRW,INR,DKK,ZAR,BRL,TWD,THB,MYR,IDR,PHP,ILS,PLN,CZK,HUF,AED,SAR,TRY,RUB,UAH,RON,NGN,KES,EGP,ARS,CLP,COP,PEN"],
  ["input.language", "select", "Language", "en,es,fr,de,zh,ja,pt,ru,ar,hi,bn,it,nl,ko,tr,pl,uk,vi,th,id,ms,he,sv,da,no,fi,el,cs,ro,hu"],
  ["input.locale", "select", "Locale", "en-US,en-GB,es-ES,fr-FR,de-DE,pt-BR,zh-CN,zh-TW,ja-JP,ko-KR,ar-SA,hi-IN,it-IT,nl-NL,ru-RU,tr-TR,pl-PL,sv-SE,da-DK,uk-UA"],
  ["input.checkbox", "checkbox", "Flag", "--flag"],
  ["input.switch", "switch", "Toggle switch", "--flag"],
  ["input.range", "range", "Range slider", "0-100"],
  ["input.time", "time", "Clock time"],
  ["input.datetime", "datetime", "Date and time"],
  ["input.textarea", "textarea", "Multiline text"],
  ["input.multiselect", "multiselect", "Multiple choice", "dev,build,test"],
  ["input.license", "select", "License (SPDX)", "MIT,Apache-2.0,GPL-3.0-only,GPL-3.0-or-later,BSD-2-Clause,BSD-3-Clause,ISC,MPL-2.0,EPL-2.0,Unlicense,CC0-1.0,CC-BY-4.0,CC-BY-SA-4.0,0BSD,Zlib,Artistic-2.0,AGPL-3.0-only,LGPL-3.0-only"],
  ["input.keyvalue", "keyvalue", "Key=value pair", "KEY=value"]
];

export const CC_RETIRED_TYPES: readonly TypeRow[] = [
  ["input.regex", "text", "Regular expression"],
  ["input.message", "textarea", "Short message"],
  ["input.title", "text", "Title"],
  ["input.description", "textarea", "Longer description"],
  ["input.username", "text", "User name"],
  ["input.hostname", "text", "Host name"],
  ["input.domain", "text", "Domain name"],
  ["input.ip", "text", "IP address"],
  ["input.count", "number", "Count"],
  ["input.quantity", "number", "Quantity"],
  ["input.percent", "range", "Percent slider", "0-100"],
  ["input.month", "range", "Month slider", "1-12"],
  ["input.day", "range", "Day-of-month slider", "1-31"],
  ["input.hour", "time", "Hour (clock time)"],
  ["input.minute", "time", "Minute (clock time)"],
  ["input.second", "time", "Second (clock time)"],
  ["input.bitrate", "number", "Bitrate value (k)"],
  ["input.extension", "select", "File extension", "mp4,mkv,mov,mp3,wav,avi,flv,webm"],
  ["input.container", "select", "Container format", "mp4,mkv,mov,avi,webm"],
  ["input.vcodec", "select", "Video codec", "libx264,libx265,vp9,av1,mpeg4"],
  ["input.acodec", "select", "Audio codec", "aac,mp3,opus,flac,vorbis"],
  ["input.preset", "select", "Encoder preset", "ultrafast,superfast,veryfast,faster,fast,medium,slow,slower,veryslow"],
  ["input.crf", "range", "Quality CRF (lower is better)", "0-51"],
  ["input.resolution", "select", "Resolution", "1920x1080,1280x720,3840x2160,640x480"],
  ["input.fps", "number", "Frames per second"],
  ["input.samplerate", "select", "Audio sample rate", "44100,48000,22050,96000"],
  ["input.channels", "select", "Audio channels", "1,2,6"],
  ["input.duration", "text", "Duration (e.g. 00:01:20)"],
  ["input.volume", "range", "Volume level", "0-100"],
  ["input.speed", "number", "Speed multiplier"],
  ["input.seek", "text", "Seek position (e.g. 00:00:10)"],
  ["input.subtitle", "file", "Subtitle file"],
  ["input.poster", "file", "Poster image"],
  ["input.thumbnail", "file", "Thumbnail image"],
  ["input.path", "file", "File or directory path"],
  ["input.folder", "file", "Folder path"],
  ["input.filename", "text", "File name"],
  ["input.glob", "text", "Glob pattern (e.g. *.js)"],
  ["input.pattern", "text", "Match pattern"],
  ["input.output", "file", "Output path"],
  ["input.template", "file", "Template file"],
  ["input.config", "file", "Config file"],
  ["input.logfile", "file", "Log file"],
  ["input.env", "select", "Environment", "development,staging,production"],
  ["input.script", "text", "Script name"],
  ["input.package", "text", "Package name"],
  ["input.pkgmanager", "select", "Package manager", "npm,bun,yarn,pnpm"],
  ["input.version", "text", "Version string"],
  ["input.semver", "text", "Semver (e.g. 1.2.3)"],
  ["input.branch", "text", "Git branch"],
  ["input.tag", "text", "Git tag"],
  ["input.remote", "select", "Git remote", "origin,upstream"],
  ["input.commit", "text", "Commit ref or message"],
  ["input.author", "text", "Author name"],
  ["input.logformat", "select", "Git log format", "oneline,short,medium,full"],
  ["input.repos", "text", "Repository"],
  ["input.org", "text", "Organization"],
  ["input.mode", "select", "Mode", "development,production"],
  ["input.loglevel", "select", "Log level", "error,warn,info,debug"],
  ["input.image", "select", "Container image", "nginx,httpd,caddy,node,postgres"],
  ["input.cimage", "text", "Container image (any)"],
  ["input.containername", "text", "Container name"],
  ["input.mount", "text", "Volume mapping"],
  ["input.network", "text", "Network name"],
  ["input.replicas", "number", "Replica count"],
  ["input.memory", "text", "Memory limit (e.g. 512m)"],
  ["input.cpu", "number", "CPU limit"],
  ["input.workdir", "file", "Working directory"],
  ["input.entrypoint", "text", "Entrypoint command"],
  ["input.restart", "select", "Restart policy", "no,always,on-failure,unless-stopped"],
  ["input.protocol", "select", "Protocol", "http,https,ssh,ftp"],
  ["input.method", "select", "HTTP method", "GET,POST,PUT,PATCH,DELETE"],
  ["input.header", "text", "HTTP header (Key: value)"],
  ["input.query", "text", "Query string"],
  ["input.cidr", "text", "CIDR range"],
  ["input.sql", "textarea", "SQL query"],
  ["input.mac", "text", "MAC address"],
  ["input.database", "text", "Database name"],
  ["input.table", "text", "Table name"],
  ["input.dbuser", "text", "DB user"],
  ["input.engine", "select", "DB engine", "postgres,mysql,sqlite,mongo"],
  ["input.cron", "text", "Cron expression"],
  ["input.timeout", "number", "Timeout seconds"],
  ["input.retries", "number", "Retry count"],
  ["input.delay", "number", "Delay seconds"],
  ["input.format", "select", "Output format", "json,yaml,text,table"],
  ["input.shell", "select", "Shell", "bash,sh,zsh,fish"],
  ["input.os", "select", "OS", "linux,macos,windows"],
  ["input.arch", "select", "CPU arch", "x64,arm64"],
  ["input.flag", "checkbox", "Flag (custom value via :flag)"],
  ["input.confirm", "checkbox", "Confirm toggle"],
  ["input.verbose", "checkbox", "Verbose flag", "--verbose"],
  ["input.quiet", "checkbox", "Quiet flag", "--quiet"],
  ["input.force", "checkbox", "Force flag", "--force"],
  ["input.dryrun", "checkbox", "Dry-run flag", "--dry-run"],
  ["input.colorname", "text", "Color name"],
  ["input.namespace", "text", "Namespace"],
  ["input.deployment", "text", "Deployment name"],
  ["input.service", "text", "Service name"],
  ["input.pod", "text", "Pod name"],
  ["input.context", "text", "Context name"],
  ["input.region", "select", "Cloud region", "us-east-1,us-west-2,eu-west-1,eu-central-1,ap-south-1"],
  ["input.profile", "text", "Cloud profile"],
  ["input.bucket", "text", "Bucket name"],
  ["input.bucketkey", "text", "Bucket key"],
  ["input.workspace", "text", "Workspace name"],
  ["input.varfile", "file", "Var file"],
  ["input.planfile", "file", "Plan file"]
];

export const CC_INPUT_ALIASES: Record<string, string> = {
  "input.hexcolor": "input.color",
  "input.bgcolor": "input.color",
  "input.fgcolor": "input.color",
  "input.token": "input.password",
  "input.apikey": "input.password",
  "input.secret": "input.password",
  "input.since": "input.date",
};

export interface ResolvedType { row: TypeRow; retired: boolean; }

/** live → retired → aliases. Returns null for truly unknown names. */
export function lookupType(name: string): ResolvedType | null {
  for (const row of CC_INPUT_TYPES) {
    if (row[0] === name) return { row, retired: false };
  }
  for (const row of CC_RETIRED_TYPES) {
    if (row[0] === name) return { row, retired: true };
  }
  const target = CC_INPUT_ALIASES[name];
  if (target) {
    for (const row of CC_INPUT_TYPES) {
      if (row[0] === target) return { row, retired: false };
    }
  }
  return null;
}

// ── widget → <e-input> mapping (task C4) ─────────────────────────────────────
// The registry's 17 widgets and the element's ~16 types are different axes;
// this fixed table bridges them. Retired tokens resolve through the same
// table via their recorded widget. Returns null only for unknown widgets
// (never for a known token — no accidental default fallthrough).

export interface EInputMapping {
  /** <e-input type> value. "keyvalue" is not a real element type — the host
   *  renders paired text fields (see `paired`). */
  type: string;
  /** format attribute for the text family (email/url/uuid). */
  format?: string;
  /** action-button attribute (file family → "browse"). */
  actionButton?: string;
  /** keyvalue renders as two text inputs joined with "=". */
  paired?: boolean;
}

const TEXT_FORMATS: Record<string, string> = {
  "input.email": "email",
  "input.url": "url",
  "input.search": "search",
  "input.uuid": "uuid",
};

const FILE_TOKENS = new Set(["input.file", "input.dir", "input.files"]);

const SELECT_FAMILY = new Set([
  "input.select",
  "input.country",
  "input.timezone",
  "input.currency",
  "input.language",
  "input.locale",
  "input.license",
]);

const WIDGET_TO_EINPUT: Record<string, string> = {
  text: "text",
  number: "number",
  date: "date",
  time: "date",
  datetime: "date",
  color: "color",
  password: "password",
  select: "select",
  radio: "radio",
  buttongroup: "radio",
  multiselect: "checkbox-group",
  checkbox: "checkbox",
  switch: "checkbox",
  range: "range",
  textarea: "textarea",
};

export function widgetToEInput(token: { name: string; type: string }): EInputMapping | null {
  const { name, type: widget } = token;
  // File family (3 tokens) → text + browse button (host picker, §4.7).
  if (FILE_TOKENS.has(name) || widget === "file") {
    return { type: "text", actionButton: "browse" };
  }
  // Text family formats.
  if (widget === "text") {
    const format = TEXT_FORMATS[name];
    return format ? { type: "text", format } : { type: "text" };
  }
  // keyvalue → paired text fields.
  if (widget === "keyvalue") {
    return { type: "text", paired: true };
  }
  // Date family (native input; no picker).
  if (widget === "date" || widget === "time" || widget === "datetime") {
    return { type: "date" };
  }
  // Select family (7 live lists + retired selects via widget).
  if (widget === "select" || SELECT_FAMILY.has(name)) {
    return { type: "select" };
  }
  const mapped = WIDGET_TO_EINPUT[widget];
  if (!mapped) return null;
  return { type: mapped };
}
