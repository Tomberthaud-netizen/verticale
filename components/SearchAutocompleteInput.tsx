"use client";

import { useState } from "react";
import { filtrerDesignations } from "@/lib/suggestionPrix";

export default function SearchAutocompleteInput({
  name,
  defaultValue = "",
  placeholder,
  suggestions,
  wrapperClassName = "flex-1 min-w-[160px]",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  suggestions: string[];
  wrapperClassName?: string;
}) {
  const [valeur, setValeur] = useState(defaultValue);
  const [ouvert, setOuvert] = useState(false);

  const completions = ouvert ? filtrerDesignations(suggestions, valeur) : [];

  return (
    <div className={`relative min-w-0 ${wrapperClassName}`}>
      <input
        type="text"
        name={name}
        autoComplete="off"
        value={valeur}
        onChange={(e) => {
          setValeur(e.target.value);
          setOuvert(true);
        }}
        onFocus={() => setOuvert(true)}
        onBlur={() => setOuvert(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOuvert(false);
        }}
        placeholder={placeholder}
        className="w-full border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
      />
      {completions.length > 0 && (
        <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
          {completions.map((completion) => (
            <li key={completion}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setValeur(completion);
                  setOuvert(false);
                }}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-background"
              >
                {completion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
