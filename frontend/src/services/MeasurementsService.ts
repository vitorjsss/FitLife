import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "@fitlife:measures:";

export type MeasureRecord = {
  id: string;
  date?: string; // ISO (YYYY-MM-DD) internally
  weight?: number;
  height?: number;
  waist?: number;
  hip?: number;
  arm?: number;
  leg?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

const getKey = (userId: string) => `${KEY_PREFIX}${userId}`;

function isBRFormat(v?: string) {
  return !!v && /^\d{2}\/\d{2}\/\d{4}$/.test(v);
}
function isoFromBR(br: string) {
  const parts = br.split("/");
  const [d, m, y] = parts;
  return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}
function normalizeToISO(date?: string) {
  if (!date) return undefined;
  if (isBRFormat(date)) return isoFromBR(date);
  // if already ISO-like YYYY-MM-DD keep it (basic validation)
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  // try to parse Date and convert
  const parsed = new Date(date);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return undefined;
}

const MeasurementsService = {
  async list(userId: string): Promise<MeasureRecord[]> {
    const raw = await AsyncStorage.getItem(getKey(userId));
    const items: MeasureRecord[] = raw ? JSON.parse(raw) : [];
    // normalize dates to ISO before returning
    return items.map((it) => ({
      ...it,
      date: normalizeToISO(it.date) || it.date,
    }));
  },

  async saveAll(userId: string, items: MeasureRecord[]) {
    // ensure stored dates are ISO
    const normalized = items.map((it) => ({ ...it, date: normalizeToISO(it.date) || it.date }));
    await AsyncStorage.setItem(getKey(userId), JSON.stringify(normalized));
  },

  async create(
    userId: string,
    rec: Omit<MeasureRecord, "id" | "createdAt" | "updatedAt">
  ) {
    const items = await MeasurementsService.list(userId);
    const id = String(Date.now());
    const now = new Date().toISOString();
    const newRec: MeasureRecord = {
      id,
      ...rec,
      date: normalizeToISO(rec.date) || rec.date,
      createdAt: now,
      updatedAt: now,
    };
    items.unshift(newRec);
    await MeasurementsService.saveAll(userId, items);
    return newRec;
  },

  async update(userId: string, id: string, patch: Partial<MeasureRecord>) {
    const items = await MeasurementsService.list(userId);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Registro não encontrado");
    const updated: MeasureRecord = {
      ...items[idx],
      ...patch,
      date: normalizeToISO(patch.date) || normalizeToISO(items[idx].date) || items[idx].date,
      updatedAt: new Date().toISOString(),
    };
    items[idx] = updated;
    await MeasurementsService.saveAll(userId, items);
    return updated;
  },

  async remove(userId: string, id: string) {
    let items = await MeasurementsService.list(userId);
    items = items.filter((i) => i.id !== id);
    await MeasurementsService.saveAll(userId, items);
  },
};

export default MeasurementsService;