; Command Centre installer — installs the `deno desktop` app (CommandCentre.exe
; + CEF runtime) directly into Program Files with a desktop shortcut. No .bat
; shim: the payload is extracted at build time into dist/CommandCentre-app/.
;
; Build:  ISCC.exe scripts/installer.iss
; Output: dist/CommandCentre-setup.exe

#define MyAppName "Command Centre"
#ifndef MyAppVersion
#define MyAppVersion "1.0.0"
#endif
#define MyAppPublisher "Deno"
#define MyAppExeName "CommandCentre.exe"

[Setup]
AppId={{7C1EF9BF-F2CE-4317-A675-72D0B07E9C9A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\Command Centre
DefaultGroupName={#MyAppName}
OutputDir=..\..\dist
OutputBaseFilename=CommandCentre-setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
; Force shell to refresh icons after update - version bump triggers overwrite
AppMutex=CommandCentreAppMutex
; Per-user by default (no UAC); the dialog offers "install for all users" (elevated).
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
UninstallDisplayIcon={app}\{#MyAppExeName}
ArchitecturesInstallIn64BitMode=x64compatible
; Ensure installer overwrites even if same version (icon update)
UsePreviousAppDir=yes
CloseApplications=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\..\dist\CommandCentre-app\CommandCentre\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Use exe's embedded icon (updated via embed-icon.ps1) so shortcut tracks exe, not stale .ico
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\{#MyAppExeName}"; IconIndex: 0; Comment: "{#MyAppName} desktop application"
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\{#MyAppExeName}"; IconIndex: 0; Comment: "{#MyAppName} desktop application"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent
