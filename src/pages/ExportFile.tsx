import React from "react";
import { useState } from "react";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ExportFile = () => {
    const [error, setError] = useState("");

    const generatePdf = async (
        title: string,
        filename: string,
        rows: any[],
        startDate: Date,
        endDate: Date
    ) => 
    {
        const doc = new jsPDF({ orientation: "landscape" });

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

        const result = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Documents,
        });

        // Opcjonalnie: otwórz natywne udostępnianie
        await Share.share({
            title: filename,
            text: "Wygenerowany raport PDF",
            url: result.uri,
        });
    };

    // Pomocnicza funkcja

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    };

    const handlePdf = (e: React.FormEvent) => {
        e.preventDefault();

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        const includeRefuelings = data.refuelings === "on";
        const includeDeliveries = data.deliveries === "on";

        if (!includeRefuelings && !includeDeliveries) {
            return setError("Musisz wybrać dane.");
        }

        setError("");

        const startDate = data.startDate
        ? new Date(String(data.startDate))
        : new Date(0);

        const endDate = data.endDate
        ? new Date(String(data.endDate))
        : new Date();

        // DOSTAWY
        if (includeDeliveries) 
        {
            const deliveries = JSON.parse(localStorage.getItem("deliveries") || "[]");

            const filtered = deliveries.filter((d: any) => {
                const date = new Date(d.date);
                return date >= startDate && date <= endDate;
            });

            if (filtered.length > 0) {
                generatePdf(
                "Dostawy paliwa",
                "dostawy.pdf",
                filtered,
                startDate,
                endDate
                );
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
                generatePdf(
                "Tankowania",
                "tankowania.pdf",
                filtered,
                startDate,
                endDate
                );
            }else{
                return setError("Niewystarczająca ilość wpisów dla tankowań");
            }
        }

        form.reset();
    };

    return (
        <div className="container">
            <h1>Pobierz do pliku</h1>

            <form onSubmit={handlePdf}>
                <p id="error" style={{ visibility: error ? "visible" : "hidden" }}>
                {error}
                </p>

                <div className="row">
                    <label>Tankowania:</label>
                    <input type="checkbox" name="refuelings" />
                </div>

                <div className="row">
                    <label>Dostawy paliwa:</label>
                    <input type="checkbox" name="deliveries" />
                </div>

                <label>Od dnia:</label>
                <input type="date" name="startDate" />

                <label>Do dnia:</label>
                <input type="date" name="endDate" />

                <button type="submit">Pobierz .pdf</button>
            </form>

            <nav>
                <a href="/">Tankowanie</a>
                <a href="/FuelDelivery">Dostawa<br/>paliwa</a>
                <a href="/ExportFile" className="active">Pobierz<br/>do pliku</a>
            </nav>
        </div>
    );
};

export default ExportFile;
