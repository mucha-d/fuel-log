import React, { useRef, useState } from "react";
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { useIonToast } from '@ionic/react';
import { exportDatabaseBackup, importDatabaseBackup } from "../services/dbConnection";
import { formatLocalDate } from "../utils/localDate";
import { Link } from "react-router-dom";

const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Nie udało się odczytać pliku."));
        reader.readAsText(file);
    });
};

const DatabaseBackup = () => {
    const [error, setError] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [present] = useIonToast();

    const handleDownloadBackup = async () => {
        setError("");
        setIsBusy(true);

        try {
            const backup = await exportDatabaseBackup();
            const filename = `fuel-log-backup_${formatLocalDate(new Date())}.json`;

            await Filesystem.requestPermissions();
            await Filesystem.writeFile({
                path: filename,
                data: backup,
                directory: Directory.Documents,
                encoding: Encoding.UTF8,
            });

            present({
                message: `Zapisano baze danych w folderze Dokumenty.`,
                duration: 3000,
                position: 'bottom',
                positionAnchor: 'nav'
            });
        } catch {
            setError("Nie udało się pobrać kopii bazy danych.");
        } finally {
            setIsBusy(false);
        }
    };

    const handleUploadClick = () => {
        setError("");
        fileInputRef.current?.click();
    };

    const handleUploadBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;
        if (!window.confirm("Wgranie kopii zastąpi aktualną bazę danych na tym urządzeniu!!")) return;

        setError("");
        setIsBusy(true);

        try {
            const backup = await readTextFile(file);
            await importDatabaseBackup(backup);

            present({
                message: "Wgrano kopię bazy danych.",
                duration: 3000,
                position: 'bottom',
                positionAnchor: 'nav'
            });
        } catch {
            setError("Nie udało się wgrać kopii bazy danych.");
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <div className="container">
            <h1>Przywracanie bazy danych</h1>

            <div className="export-form">
                <p id="error" style={{ visibility: error ? "visible" : "hidden" }}>
                    {error}
                </p>

                <button type="button" onClick={handleDownloadBackup} disabled={isBusy}>
                    Pobierz kopię
                </button>
                <button type="button" onClick={handleUploadClick} disabled={isBusy}>
                    Wgraj kopię
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleUploadBackup}
                    style={{ display: "none" }}
                />
            </div>

            <nav id="nav">
                <Link to="/">Tankowanie</Link>
                <Link to="/FuelDelivery">Dostawa<br/>paliwa</Link>
                <Link to="/ExportFile">Pobierz<br/>do pliku</Link>
            </nav>
        </div>
    );
};

export default DatabaseBackup;
