import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { FuelEntry } from '../types/fuel';

const sqlite = new SQLiteConnection(CapacitorSQLite);
const DB_NAME = 'fueldb';
let db: SQLiteDBConnection | null = null;

const CREATE_TABLES = `
    CREATE TABLE IF NOT EXISTS refuelings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        time TEXT,
        machine TEXT,
        sideNumber TEXT,
        operator TEXT,
        liters REAL,
        engineHours REAL,
        total REAL
    );
    CREATE TABLE IF NOT EXISTS deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        time TEXT,
        machine TEXT,
        sideNumber TEXT,
        operator TEXT,
        liters REAL,
        engineHours REAL,
        total REAL
    );
`;

export const initDB = async (): Promise<void> => {
    await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

    if (isConn) {
        db = await sqlite.retrieveConnection(DB_NAME, false);
    } else {
        db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    }

    await db.open();
    await db.execute(CREATE_TABLES);
};

const getDB = (): SQLiteDBConnection => {
    if (!db) throw new Error('Baza danych nie jest zainicjalizowana. Wywołaj initDB() najpierw.');
    return db;
};

export const addRefueling = async (entry: FuelEntry): Promise<void> => {
    await getDB().run(
        `INSERT INTO refuelings (date, time, machine, sideNumber, operator, liters, engineHours, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [entry.date, entry.time, entry.machine, entry.sideNumber, entry.operator, entry.liters, entry.engineHours, entry.total]
    );
};

export const addFuelDelivery = async (entry: FuelEntry): Promise<void> => {
    await getDB().run(
        `INSERT INTO deliveries (date, time, machine, sideNumber, operator, liters, engineHours, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [entry.date, entry.time, entry.machine, entry.sideNumber, entry.operator, entry.liters, entry.engineHours, entry.total]
    );
};

export const getRefuelings = async (startDate: string, endDate: string): Promise<FuelEntry[]> => {
    const result = await getDB().query(
        `SELECT date, time, machine, sideNumber, operator, liters, engineHours, total FROM refuelings WHERE date >= ? AND date <= ? ORDER BY date ASC, time ASC`,
        [startDate, endDate]
    );
    return (result.values ?? []) as FuelEntry[];
};

export const getFuelDeliveries = async (startDate: string, endDate: string): Promise<FuelEntry[]> => {
    const result = await getDB().query(
        `SELECT date, time, machine, sideNumber, operator, liters, engineHours, total FROM deliveries WHERE date >= ? AND date <= ? ORDER BY date ASC, time ASC`,
        [startDate, endDate]
    );
    return (result.values ?? []) as FuelEntry[];
};

export const exportDatabaseBackup = async (): Promise<string> => {
    const result = await getDB().exportToJson('full');

    if (!result.export || result.export.database !== DB_NAME) {
        throw new Error('Nie udało się przygotować kopii bazy danych.');
    }

    return JSON.stringify({ ...result.export, overwrite: true }, null, 2);
};

export const importDatabaseBackup = async (jsonstring: string): Promise<void> => {
    const parsed = JSON.parse(jsonstring);

    if (parsed?.database !== DB_NAME || parsed?.mode !== 'full' || !Array.isArray(parsed?.tables)) {
        throw new Error('Wybrany plik nie jest poprawną kopią bazy tej aplikacji.');
    }

    const backup = JSON.stringify({ ...parsed, overwrite: true });
    const isValid = (await sqlite.isJsonValid(backup)).result;

    if (!isValid) {
        throw new Error('Wybrany plik kopii jest uszkodzony.');
    }

    try {
        if (db) {
            await db.close();
            await sqlite.closeConnection(DB_NAME, false);
            db = null;
        }

        await sqlite.importFromJson(backup);
    } finally {
        await initDB();
    }
};
