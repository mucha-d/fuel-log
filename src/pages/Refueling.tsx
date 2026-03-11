import React from "react";
import { useState } from "react";

const Refueling = () => {
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => 
    {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const data = Object.fromEntries(formData);

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
			...data,
			date: now.toISOString().split("T")[0],
			time: now.toLocaleTimeString("pl-PL"),
		};

		const old = JSON.parse(localStorage.getItem("refuelings") || "[]");
		old.push(entry);
		localStorage.setItem("refuelings", JSON.stringify(old));

		e.currentTarget.reset();
    };

	return (
		<div className="container">
			<h1>Tankowanie</h1>

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

			<nav>
				<a href="/" className="active">Tankowanie</a>
				<a href="/FuelDelivery">Dostawa<br/>paliwa</a>
				<a href="/ExportFile">Pobierz<br/>do pliku</a>
			</nav>
		</div>
	);
};

export default Refueling;
