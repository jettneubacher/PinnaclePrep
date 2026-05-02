import type { CsvDataset } from "../../context/CsvDataContext";

function columnOrder(dataset: CsvDataset): string[] {
  if (dataset.fields?.length) {
    return dataset.fields;
  }
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const row of dataset.rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k);
        ordered.push(k);
      }
    }
  }
  return ordered;
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export default function DataCsvTable({ dataset }: { dataset: CsvDataset }) {
  const cols = columnOrder(dataset);

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} className="data-table__th" scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataset.rows.map((row, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c} className="data-table__td">
                  {cellText(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
