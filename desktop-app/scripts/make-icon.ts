// Generates design/app.ico from design/icon.png via PowerShell + System.Drawing.
// Run: deno task make-icon
// PNG-in-ICO (256x256) — no external tools needed.
import { fromFileUrl } from "std/path";

const src = fromFileUrl(new URL("../../design/icon.png", import.meta.url));
const out = fromFileUrl(new URL("../../design/app.ico", import.meta.url));

const ps = [
  "Add-Type -AssemblyName System.Drawing",
  `$src = '${src}'`,
  `$dst = '${out}'`,
  "$img = [System.Drawing.Image]::FromFile($src)",
  "$bmp = New-Object System.Drawing.Bitmap($img, 256, 256)",
  "$img.Dispose()",
  "$hicon = $bmp.GetHicon()",
  "$icon = [System.Drawing.Icon]::FromHandle($hicon)",
  "$fs = [System.IO.File]::OpenWrite($dst)",
  "$icon.Save($fs)",
  "$fs.Close()",
  "$icon.Dispose()",
  "$bmp.Dispose()",
  "Write-Output 'WROTE:' + $dst",
].join("; ");

const proc = new Deno.Command("powershell.exe", {
  args: ["-NoProfile", "-NonInteractive", "-Command", ps],
  stdout: "piped",
  stderr: "piped",
  windowsHide: true,
});
const r = await proc.output();
const stdout = new TextDecoder().decode(r.stdout);
const stderr = new TextDecoder().decode(r.stderr);
if (!r.success) {
  throw new Error(`make-icon failed: ${stderr || stdout}`);
}
const stat = await Deno.stat(out);
console.log(stdout.trim(), stat.size, "bytes");
