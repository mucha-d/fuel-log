import React from "react";
import { useState } from "react";
import { useIonToast } from '@ionic/react';
import { addFuelDelivery } from "../services/dbConnection";

const FuelDelivery = () => {
    const [error, setError] = useState("");
    const [present] = useIonToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => 
    {
        e.preventDefault();
        const form = e.currentTarget;
		const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // VALIDATION
        if (!data.machine || String(data.machine).trim() === "") {
            return setError("Podaj nazwę maszyny.");
        }
        if (!data.sideNumber || String(data.sideNumber).trim() === "") {
            return setError("Podaj numer boczny pojazdu.");
        }
        if (!data.liters || Number(data.liters) <= 0) {
            return setError("Podaj poprawną liczbę litrów.");
        }
        if (!data.operator || String(data.operator).trim() === "") {
            return setError("Podaj operatora.");
        }
        if (!data.engineHours || Number(data.engineHours) < 0) {
            return setError("Podaj poprawne motogodziny.");
        }
        if (!data.total || Number(data.total) <= 0) {
            return setError("Podaj poprawny total.");
        }

        setError("");

        const now = new Date();
        const entry = {
            date: now.toISOString().split("T")[0],
            time: now.toLocaleTimeString("pl-PL"),
            machine: String(data.machine),
            sideNumber: String(data.sideNumber),
            operator: String(data.operator),
            liters: Number(data.liters),
            engineHours: Number(data.engineHours),
            total: Number(data.total)
        };
        
        //ZAPIS
        try {
            await addFuelDelivery(entry);
            present({
                message: `Zapisano wpis!`,
                duration: 3000,
                position: 'bottom',
                positionAnchor: 'nav'
            });
            form.reset();
        } catch {
            setError("Błąd zapisu. Spróbuj ponownie.");
        }	
    };

    return (
        <div className="container">
            <h1>Dostawa paliwa</h1>

            <form onSubmit={handleSubmit}>
                <p id="error" style={{ visibility: error ? "visible" : "hidden" }}>
                {error}
                </p>

                <input type="text" name="machine" placeholder="Maszyna" />
                <input type="text" name="sideNumber" placeholder="Numer boczny pojazdu" />
                <input type="number" name="liters" placeholder="Litry" />
                <input type="text" name="operator" placeholder="Operator" />
                <input type="number" name="engineHours" placeholder="Motogodziny" />
                <input type="number" name="total" placeholder="Total" />

                <button type="submit">Zapisz</button>
            </form>

            <nav id="nav">
                <a href="/">Tankowanie</a>
                <a href="/FuelDelivery" className="active">Dostawa<br/>paliwa</a>
                <a href="/ExportFile">Pobierz<br/>do pliku</a>
            </nav>
        </div>
    );
};

export default FuelDelivery;
