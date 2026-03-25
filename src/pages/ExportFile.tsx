import React from "react";
import { useState } from "react";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useIonToast } from '@ionic/react';
import * as XLSX from 'xlsx';

type RangeMode = "month" | "custom";
type DataType = "refuelings" | "deliveries" | "both";

const MONTHS = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];

const ExportFile = () => {
    const now = new Date();

    const [error, setError] = useState("");
    const [present] = useIonToast();

    const [rangeMode, setRangeMode] = useState<RangeMode>("month");
    const [dataType, setDataType] = useState<DataType>("both");
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

    const getDateRange = (): { startDate: Date; endDate: Date; label: string } => {
        if (rangeMode === "month") {
            const startDate = new Date(selectedYear, selectedMonth, 1);
            const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
            const label = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
            return { startDate, endDate, label };
        } else {
            const startDate = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
            const endDate = customEnd ? new Date(customEnd + "T23:59:59") : new Date();
            const fmt = (d: Date) =>
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const label = `${fmt(startDate)}_${fmt(endDate)}`;
            return { startDate, endDate, label };
        }
    };

    const columnLabels: Record<string, string> = {
        date: "Data",
        liters: "Litry",
        machine: "Maszyna",
        sideNumber: "Numer boczny",
        operator: "Operator",
        total: "Total",
        time: "Godzina",
        engineHours: "MotoGodziny"
    };

    // Pomocnicza funkcja
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    };

    const generatePdf = async (
        title: string,
        filename: string,
        rows: any[],
        startDate: Date,
        endDate: Date
    ) => 
    {
        const doc = new jsPDF({ orientation: "landscape" });
        const columns = Object.keys(rows[0]);
        const headers = columns.map((c) => columnLabels[c] || c);

        // wartości w tej samej kolejności co kolumny
        const body = rows.map((row) => columns.map((c) => row[c]));

        doc.setFont("helvetica", "bold");
        doc.setFontSize(32);
        doc.text(title, 20, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(20);
        doc.text(
        `Od: ${startDate.toLocaleDateString()} do: ${endDate.toLocaleDateString()}`,
        16,
        35
        );

        autoTable(doc, {
            startY: 40,
            head: [headers],
            body: body,
            styles: { fontSize: 14 },
        });

        const pdfOutput = doc.output("arraybuffer");
        const pdfBlob = new Blob([pdfOutput], { type: "application/pdf" });

        const base64Full = await blobToBase64(pdfBlob);
        const base64Data = base64Full.split(",")[1];

        await Filesystem.requestPermissions();
        await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Documents,
        });

    };

    const generateXlsx = async (
        title: string,
        filename: string,
        rows: any[]
    ) =>
    {
        const columns = Object.keys(rows[0]);
        const headers = columns.map((c) => columnLabels[c] || c);
        const body = rows.map((row) => columns.map((c) => {
            if (c === 'date') return new Date(row[c]);
            return row[c];
        }));

        const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
        ws['!cols'] = columns.map(() => ({ wch: 20 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title);

        const xlsxOutput = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([xlsxOutput], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const base64Full = await blobToBase64(blob);
        const base64Data = base64Full.split(",")[1];

        await Filesystem.requestPermissions();
        await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Documents,
        });
    }

    const handleExport = async (format: 'pdf' | 'xlsx') => {
        setError("");

        const includeRefuelings = dataType === 'refuelings' || dataType === 'both';
        const includeDeliveries = dataType === 'deliveries' || dataType === 'both';

        if(rangeMode === "custom" && customStart === "" || customEnd === ""){
            return setError("Musisz podać daty w zakresie!");
        }

        const {startDate, endDate, label} = getDateRange();
        if(startDate > endDate){
            return setError("Nieprawidłowy zakres dat!");
        }

        const files: string[] = [];

        // DOSTAWY
        if (includeDeliveries) 
        {
            const deliveries = JSON.parse(localStorage.getItem("deliveries") || "[]");
            const filtered = deliveries.filter((d: any) => {
                const date = new Date(d.date);
                return date >= startDate && date <= endDate;
            });

            if (filtered.length > 0) {
                if(format === 'pdf'){
                    const filename = `dostawy_${label}.pdf`;
                    await generatePdf(
                        "Dostawy paliwa",
                        filename,
                        filtered,
                        startDate,
                        endDate
                    );
                    files.push(filename);
                }
                else if(format === 'xlsx'){
                    const filename = `dostawy_${label}.xlsx`;
                    await generateXlsx(
                        "Dostawy paliwa",
                        filename,
                        filtered
                    );
                    files.push(filename);
                }
            }else{
                return setError("Niewystarczająca ilość wpisów dla dostaw paliwa");
            }
        }

        // TANKOWANIA
        if (includeRefuelings) 
        {
            const refuelings = JSON.parse(localStorage.getItem("refuelings") || "[]");
            const filtered = refuelings.filter((d: any) => {
                const date = new Date(d.date);
                return date >= startDate && date <= endDate;
            });

            if (filtered.length > 0) {
                if(format === 'pdf'){
                    const filename = `tankowania_${label}.pdf`;
                    await generatePdf(
                        "Tankowania",
                        filename,
                        filtered,
                        startDate,
                        endDate
                    );
                    files.push(filename);
                }
                else if(format === 'xlsx'){
                    const filename = `tankowania_${label}.xlsx`;
                    await generateXlsx(
                        "Tankowania",
                        filename,
                        filtered
                    );
                    files.push(filename);
                }
            }else{
                return setError("Niewystarczająca ilość wpisów dla tankowań");
            }
        }

        present({
            message: `Zapisano ${files.length} ${(files.length > 1) ? "pliki" : "plik"}!!`,
            duration: 3000,
            position: 'bottom',
            positionAnchor: 'nav'
        });

    };

    return (
        <div className="container">
            <h1>Pobierz do pliku</h1>
            <div className="export-form">
                <p id="error" style={{ visibility: error ? "visible" : "hidden" }}>
                    {error}
                </p>

                {/* DANE DO POBRANIA */}
                <div className="field-group">
                    <label>Dane:</label>
                    <div className="radio-group">
                        {([
                            ["refuelings", "Tankowania"],
                            ["deliveries", "Dostawy paliwa"],
                            ["both", "Oba"],
                        ] as [DataType, string][]).map(([val, lbl]) => (
                            <label key={val} className="radio-label">
                                <input
                                    type="radio"
                                    name="dataType"
                                    value={val}
                                    checked={dataType === val}
                                    onChange={() => setDataType(val)}
                                />
                                {lbl}
                            </label>
                        ))}
                    </div>
                </div>

                {/* SPOSÓB WYBORU DATY */}
                <div className="field-group">
                    <label>Zakres:</label>
                    <div className="radio-group">
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="rangeMode"
                                checked={rangeMode === "month"}
                                onChange={() => setRangeMode("month")}
                            />
                            Miesiąc
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="rangeMode"
                                checked={rangeMode === "custom"}
                                onChange={() => setRangeMode("custom")}
                            />
                            Własny zakres
                        </label>
                    </div>
                </div>

                {/* WYBÓR MIESIĄCA */}
                {rangeMode === "month" && (
                    <div className="month-picker">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* DOWNOLNY ZAKRES DAT */}
                {rangeMode === "custom" && (
                    <div className="custom-range">
                        <div className="row">
                            <label>Od dnia:</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                            />
                        </div>
                        <div className="row">
                            <label>Do dnia:</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <div className='row'>
                    <button type="button" onClick={(e) => handleExport('pdf')}>Pobierz PDF</button>
                    <button type="button" onClick={(e) => handleExport('xlsx')}>Pobierz Excel</button>
                </div>
            </div>
            <nav id="nav">
                <a href="/">Tankowanie</a>
                <a href="/FuelDelivery">Dostawa<br/>paliwa</a>
                <a href="/ExportFile" className="active">Pobierz<br/>do pliku</a>
            </nav>
        </div>
    );
};

export default ExportFile;
