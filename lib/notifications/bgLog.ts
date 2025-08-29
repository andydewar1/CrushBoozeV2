import * as FileSystem from 'expo-file-system';

const DIR = `${FileSystem.documentDirectory}BG_LOGS`;
const FILE = `${DIR}/bg.txt`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

export async function bgLog(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  // Always console too (shows in Metro sometimes)
  // eslint-disable-next-line no-console
  console.log('[BG]', msg);
  try {
    await ensureDir();
    const info = await FileSystem.getInfoAsync(FILE);
    if (info.exists) {
      const existing = await FileSystem.readAsStringAsync(FILE);
      await FileSystem.writeAsStringAsync(FILE, existing + line, { encoding: FileSystem.EncodingType.UTF8 });
    } else {
      await FileSystem.writeAsStringAsync(FILE, line, { encoding: FileSystem.EncodingType.UTF8 });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('[BG] log write failed:', e);
  }
}

export async function bgReadLogs(): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    if (!info.exists) return 'No logs yet.';
    return await FileSystem.readAsStringAsync(FILE);
  } catch {
    return 'Error reading logs.';
  }
}
