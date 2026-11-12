"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { money } from "../../commerce";
export type PriceTable = {
  id: string;
  label: string;
  basis?: string;
  perMatch?: boolean;
  rows: readonly (readonly [rank: string, price: number | null])[];
};

export function PriceTabs({ tables, game, inquiryLabel }: {
  tables: readonly PriceTable[];
  game: string;
  inquiryLabel: string;
}) {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const table = tables[selected];

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tables.length - 1;
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
      <div role="tablist" aria-label={`${game} 서비스 유형`} className={`mt-6 grid ${tables.length === 3 ? "grid-cols-3" : "grid-cols-4"} gap-2 rounded-lg border border-line bg-panel p-2`}>
        {tables.map(({ id, label }, index) => (
          <button
            key={id}
            ref={(node) => { tabs.current[index] = node; }}
            type="button"
            role="tab"
            id={`price-tab-${id}`}
            aria-selected={selected === index}
            aria-controls={`price-panel-${id}`}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => moveTab(event, index)}
            className="min-h-11 cursor-pointer rounded-md px-1 text-[15px] font-semibold text-muted hover:bg-canvas hover:text-ink aria-selected:bg-brand aria-selected:text-button-ink"
          >
            {label}
          </button>
        ))}
      </div>
      {tables.map(({ id }) => (
        <div key={id} role="tabpanel" id={`price-panel-${id}`} aria-labelledby={`price-tab-${id}`} hidden={id !== table.id} tabIndex={0}>
          {id === table.id && (
            <div className="mt-4 overflow-hidden rounded-lg border border-line bg-panel">
              <table aria-label={`${table.label} 가격표`} className="w-full table-fixed text-base tabular-nums">
                <thead className="bg-canvas text-sm text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-semibold sm:px-7">티어</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-7">{table.basis ? `가격 (${table.basis})` : "가격"}</th>
                  </tr>
                </thead>
                <tbody>
                  {!table.rows.length && <tr><td colSpan={2} className="px-4 py-5 text-center text-muted">공개된 가격이 없습니다.</td></tr>}
                  {table.rows.map(([rank, price]) => (
                    <tr key={rank} className={`border-t border-line ${price === null ? "bg-brand/10" : ""}`}>
                      <th scope="row" className="px-4 py-3 text-left font-medium sm:px-7">{rank}</th>
                      <td className="px-4 py-3 text-right font-semibold text-brand sm:px-7">
                        {price === null ? inquiryLabel : `${table.perMatch ? "판당 " : ""}${money(price)}`}
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
