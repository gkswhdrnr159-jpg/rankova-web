"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { money } from "../../commerce";
import { valorantPrices } from "./valorant-prices";

export function ValorantPriceTabs() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const table = valorantPrices[selected];

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = valorantPrices.length - 1;
    const keys: Record<string, number | undefined> = {
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowRight: index === last ? 0 : index + 1,
      Home: 0,
      End: last,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  }

  return (
    <>
      <div role="tablist" aria-label="발로란트 서비스 유형" className="mt-6 grid grid-cols-4 gap-2 rounded-lg border border-line bg-panel p-2">
        {valorantPrices.map(({ id, label }, index) => (
          <button
            key={id}
            ref={(node) => { tabs.current[index] = node; }}
            type="button"
            role="tab"
            id={`valorant-tab-${id}`}
            aria-selected={selected === index}
            aria-controls={`valorant-panel-${id}`}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => moveTab(event, index)}
            className="min-h-11 cursor-pointer rounded-md px-1 text-[15px] font-semibold text-muted hover:bg-canvas hover:text-ink aria-selected:bg-brand aria-selected:text-button-ink"
          >
            {label}
          </button>
        ))}
      </div>
      {valorantPrices.map(({ id }) => (
        <div key={id} role="tabpanel" id={`valorant-panel-${id}`} aria-labelledby={`valorant-tab-${id}`} hidden={id !== table.id} tabIndex={0}>
          {id === table.id && (
            <div className="mt-4 overflow-hidden rounded-lg border border-line bg-panel">
              <table aria-label={`${table.label} 가격표`} className="w-full table-fixed text-base tabular-nums">
                <thead className="bg-canvas text-sm text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-semibold sm:px-7">티어</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-7">가격</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map(([rank, price]) => (
                    <tr key={rank} className={`border-t border-line ${price === null ? "bg-brand/10" : ""}`}>
                      <th scope="row" className="px-4 py-3 text-left font-medium sm:px-7">{rank}</th>
                      <td className="px-4 py-3 text-right font-semibold text-brand sm:px-7">
                        {price === null ? "가격 문의" : `${table.perMatch ? "판당 " : ""}${money(price)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </>
  );
}


