"use client";

import { useState } from "react";

const ACCENT = "#8B4513";
const SUGGESTIONS = ["Ndiaye", "Diop", "Dakar", "Fall", "Saint-Louis", "Thiès"];

export default function HeroSearch() {
  const [nom, setNom] = useState("");
  const [lieu, setLieu] = useState("");
  const [type, setType] = useState("Famille");

  return (
    <section className="w-full bg-white px-6 py-16 sm:px-12 sm:py-24 flex flex-col items-center">

      {/* Eyebrow */}
      <p
        className="text-xs tracking-widest mb-6 text-center"
        style={{ color: ACCENT, fontVariant: "small-caps", letterSpacing: "0.18em" }}
      >
        Le registre des familles sénégalaises
      </p>

      {/* Headline */}
      <h1
        className="text-3xl sm:text-4xl lg:text-5xl text-black text-center leading-tight mb-4 max-w-2xl"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
      >
        Recherchez une famille, une personne ou une localité
      </h1>

      {/* Subtext */}
      <p className="text-sm text-gray-500 text-center mb-10 max-w-md leading-relaxed">
        Des milliers de familles sénégalaises documentées — lignées, foyers, localités d'origine.
      </p>

      {/* Search block */}
      <div className="w-full max-w-3xl">
        <div
          className="w-full flex flex-col sm:flex-row"
          style={{ border: "1px solid #d1d5db" }}
        >
          {/* Champ nom */}
          <div
            className="flex-1 flex flex-col"
            style={{ borderBottom: "1px solid #d1d5db" }}
          >
            <label
              className="text-[10px] uppercase tracking-widest px-4 pt-3 pb-1"
              style={{ color: "#9ca3af", letterSpacing: "0.12em" }}
            >
              Nom de famille / Lignée
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex. Diallo, Ndiaye…"
              className="px-4 pb-3 text-sm text-black placeholder-gray-400 outline-none bg-white w-full"
            />
          </div>

          {/* Champ lieu */}
          <div
            className="flex-1 flex flex-col"
            style={{
              borderBottom: "1px solid #d1d5db",
              borderLeft: "1px solid #d1d5db",
            }}
          >
            <label
              className="text-[10px] uppercase tracking-widest px-4 pt-3 pb-1"
              style={{ color: "#9ca3af", letterSpacing: "0.12em" }}
            >
              Ville ou région
            </label>
            <input
              type="text"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              placeholder="ex. Thiès, Casamance…"
              className="px-4 pb-3 text-sm text-black placeholder-gray-400 outline-none bg-white w-full"
            />
          </div>

          {/* Select type */}
          <div
            className="flex-[0.7] flex flex-col"
            style={{
              borderBottom: "1px solid #d1d5db",
              borderLeft: "1px solid #d1d5db",
            }}
          >
            <label
              className="text-[10px] uppercase tracking-widest px-4 pt-3 pb-1"
              style={{ color: "#9ca3af", letterSpacing: "0.12em" }}
            >
              Type
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="appearance-none w-full px-4 pb-3 text-sm text-black outline-none bg-white cursor-pointer"
              >
                <option>Famille</option>
                <option>Personne</option>
                <option>Localité</option>
                <option>Lignée</option>
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1.5"
                width="10"
                height="10"
                viewBox="0 0 12 12"
                fill="none"
                style={{ color: "#9ca3af" }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Search button — full width, below fields */}
        <button
          type="button"
          className="w-full py-3 mt-0 text-sm font-semibold tracking-wide text-white transition-opacity hover:opacity-90"
          style={{
            backgroundColor: ACCENT,
            borderRadius: "0 0 4px 4px",
          }}
        >
          Rechercher dans le registre
        </button>

        {/* Suggestions */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-xs text-gray-400 tracking-wide">Fréquents —</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setNom(s)}
              className="text-sm transition-colors pb-px"
              style={{
                color: ACCENT,
                borderBottom: `1px solid transparent`,
                textDecoration: "none",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.borderBottomColor = ACCENT)
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.borderBottomColor = "transparent")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
