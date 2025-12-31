import { useMemo, useState } from "react";
import { analyzeCsv } from "./api";
import "./App.css";

function Section({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function KeyValueTable({ obj }) {
  const entries = useMemo(() => Object.entries(obj || {}), [obj]);
  if (!entries.length) return <p className="muted">None</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k}>
            <td className="mono">{k}</td>
            <td className="mono">{typeof v === "number" ? v.toFixed(4) : String(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function parseCsvHeaderLine(line) {
  // Minimal CSV header parser that supports quoted headers with commas.
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"' ) {
      // handle escaped quote ""
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }

    cur += ch;
  }
  out.push(cur.trim());

  // strip wrapping quotes if any
  return out
    .map((s) => s.replace(/^"(.*)"$/, "$1").trim())
    .filter((s) => s.length > 0);
}

function rankLabelCandidates(columns) {
  const keywords = ["label", "target", "class", "outcome", "y", "is_", "has_"];
  const scored = columns.map((c, idx) => {
    const lc = c.toLowerCase();
    let score = 0;

    // keyword hits
    for (const k of keywords) {
      if (lc === k || lc.includes(k)) score += 5;
    }
    // common conventions
    if (lc === "y") score += 6;
    if (lc === "target" || lc === "label") score += 8;

    // last column is often the label
    if (idx === columns.length - 1) score += 2;

    return { col: c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const suggested = scored.filter((s) => s.score >= 5).map((s) => s.col);
  const rest = scored.filter((s) => s.score < 5).map((s) => s.col);

  return { suggested, rest };
}


export default function App() {
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [columns, setColumns] = useState([]);
  const [suggestedLabels, setSuggestedLabels] = useState([]);


  async function onAnalyze(e) {
    e.preventDefault();
    setErr("");
    setResult(null);

    if (!file) {
      setErr("Please choose a CSV file first.");
      return;
    }

    setLoading(true);
    try {
      const data = await analyzeCsv(file, label);
      setResult(data);
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <h1>ML Data Audit</h1>
        <p className="muted">
          Upload a CSV to get dataset health stats. Optionally provide a label column for
          imbalance & leakage checks.
        </p>
      </header>

      <form className="card" onSubmit={onAnalyze}>
        <div className="row">
          <label className="label">
            CSV File
            <input
  type="file"
  accept=".csv,text/csv"
  onChange={(e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    setErr("");

    if (!f) {
      setColumns([]);
      setSuggestedLabels([]);
      setLabel("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const firstLine = text.split(/\r?\n/)[0] || "";
      const cols = parseCsvHeaderLine(firstLine);

      setColumns(cols);

      const ranked = rankLabelCandidates(cols);
      setSuggestedLabels(ranked.suggested);

      // auto-select best suggestion if available; else blank
      setLabel(ranked.suggested[0] || "");
    };

    // Only read first ~64KB (enough to include header + some rows)
    const blob = f.slice(0, 64 * 1024);
    reader.readAsText(blob);
  }}
/>
          </label>
          <label className="label">
  Label column (optional)
  <select value={label} onChange={(e) => setLabel(e.target.value)}>
    <option value="">(none)</option>

    {suggestedLabels.length > 0 && (
      <optgroup label="Suggested">
        {suggestedLabels.map((c) => (
          <option key={`s-${c}`} value={c}>
            {c}
          </option>
        ))}
      </optgroup>
    )}

    {columns.length > 0 && (
      <optgroup label="All columns">
        {columns.map((c) => (
          <option key={`a-${c}`} value={c}>
            {c}
          </option>
        ))}
      </optgroup>
    )}
  </select>
          </label>
        </div>

        <div className="row">
          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>

          {file && (
            <span className="muted">
              Selected: <span className="mono">{file.name}</span>
            </span>
          )}
        </div>

        {err && <p className="error">Error: {err}</p>}
      </form>

      {result && (
        <div className="grid">
          <Section title="Overview">
            <p>
              Rows: <span className="mono">{result.n_rows}</span> &nbsp;|&nbsp; Columns:{" "}
              <span className="mono">{result.n_columns}</span>
            </p>
            {result.label && (
              <p>
                Label: <span className="mono">{result.label}</span>
              </p>
            )}
          </Section>

          <Section title="Column Types">
            <KeyValueTable obj={result.column_types} />
          </Section>

          <Section title="Missing Fraction (per column)">
            <KeyValueTable obj={result.missing_fraction} />
          </Section>

          <Section title="Class Balance">
            <KeyValueTable obj={result.class_balance} />
          </Section>

          <Section title="Top Label Correlations (abs)">
            <KeyValueTable obj={result.top_label_correlations} />
          </Section>

          <Section title="Leakage Warnings">
            {Array.isArray(result.leakage_warnings) && result.leakage_warnings.length ? (
              <ul>
                {result.leakage_warnings.map((w, i) => (
                  <li key={i}>
                    <span className="mono">{w.feature}</span> —{" "}
                    <span className="mono">{Number(w.abs_corr).toFixed(4)}</span>
                    <div className="muted">{w.reason}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">None</p>
            )}
          </Section>

          <Section title="Raw JSON">
            <pre className="pre">{JSON.stringify(result, null, 2)}</pre>
          </Section>
        </div>
      )}

      <footer className="footer muted">
        Backend expected at <span className="mono">http://127.0.0.1:8000</span>
      </footer>
    </div>
  );
}
