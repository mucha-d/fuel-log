import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
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
    const isConn = (await sqlite.isConnection('fueldb', false)).result;

    if (isConn) {
        db = await sqlite.retrieveConnection('fueldb', false);
    } else {
        db = await sqlite.createConnection('fueldb', false, 'no-encryption', 1, false);
    }

    await db.open();
    await db.execute(CREATE_TABLES);
};

const getDB = (): SQLiteDBConnection => {
    if (!db) throw new Error('Baza danych nie jest zainicjalizowana. Wywołaj initDB() najpierw.');
    return db;
};

export const addRefueling = async (entry: {
    date: string;
    time: string;
    machine: string;
    sideNumber: string;
    operator: string;
    liters: number;
    engineHours: number;
    total: number;
}): Promise<void> => {
    await getDB().run(
        `INSERT INTO refuelings (date, time, machine, sideNumber, operator, liters, engineHours, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [entry.date, entry.time, entry.machine, entry.sideNumber, entry.operator, entry.liters, entry.engineHours, entry.total]
    );
};

export const addFuelDelivery = async (entry: {
    date: string;
    time: string;
    machine: string;
    sideNumber: string;
    operator: string;
    liters: number;
    engineHours: number;
    total: number;
}): Promise<void> => {
    await getDB().run(
        `INSERT INTO deliveries (date, time, machine, sideNumber, operator, liters, engineHours, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [entry.date, entry.time, entry.machine, entry.sideNumber, entry.operator, entry.liters, entry.engineHours, entry.total]
    );
};

export const getRefuelings = async (startDate: string, endDate: string): Promise<any[]> => {
    const result = await getDB().query(
        `SELECT date, time, machine, sideNumber, operator, liters, engineHours, total FROM refuelings WHERE date >= ? AND date <= ? ORDER BY date ASC, time ASC`,
        [startDate, endDate]
    );
    return result.values ?? [];
};

export const getFuelDeliveries = async (startDate: string, endDate: string): Promise<any[]> => {
    const result = await getDB().query(
        `SELECT date, time, machine, sideNumber, operator, liters, engineHours, total FROM deliveries WHERE date >= ? AND date <= ? ORDER BY date ASC, time ASC`,
        [startDate, endDate]
    );
    return result.values ?? [];
};