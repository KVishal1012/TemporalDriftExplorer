import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Bookmark, CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Download, Layers3, LocateFixed, Menu, MessageSquareText, Minus,
  Pause, Play, Plus, Search, Settings, Share2, Sparkles, Users, X,
} from "lucide-react";
import { cityProfiles, initialLayers, years, type CityKey, type EvidenceSeries, type LayerKey } from "./data";

const zoningParcels = [
  ["5,4 34,2 34,28 3,32", "#7b68ad"], ["38,2 66,2 66,25 38,27", "#df8c3d"],
  ["70,2 98,2 98,25 70,26", "#d8ba3d"], ["3,35 32,31 34,61 2,63", "#639463"],
  ["38,30 65,28 67,62 39,63", "#d55d4d"], ["71,30 98,29 98,62 70,64", "#d7bb41"],
  ["2,67 34,66 34,98 2,98", "#446ea9"], ["39,67 66,66 67,98 39,98", "#7b68ad"],
  ["71,67 98,66 98,98 71,98", "#65945e"],
];

function Sparkline({ series }: { series: EvidenceSeries }) {
  const max = Math.max(...series.values);
  const min = Math.min(...series.values);
  const points = series.values.map((value, index) => {
    const x = (index / (series.values.length - 1)) * 100;
    const y = 28 - ((value - min) / (max - min || 1)) * 22;
    return `${x},${y}`;
  }).join(" ");

  return <svg className="sparkline" viewBox="0 0 100 32" preserveAspectRatio="none">
    <polyline points={points} fill="none" stroke={series.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
  </svg>;
}

function App() {
  const [year, setYear] = useState(2018);
  const [city, setCity] = useState<CityKey>("toronto");
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [layers, setLayers] = useState(initialLayers);
  const [playing, setPlaying] = useState(false);
  const [compare, setCompare] = useState(true);
  const [swipe, setSwipe] = useState(18);
  const [activeFinding, setActiveFinding] = useState(1);
  const [explainer, setExplainer] = useState<"idle" | "loading" | "ready">("ready");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const profile = cityProfiles[city];
  const snapshot = useMemo(() => profile.snapshots.find((item) => item.year === year)!, [profile, year]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setYear((current) => current >= 2024 ? 2008 : current + 1), 850);
    return () => window.clearInterval(timer);
  }, [playing]);

  const layer = (id: LayerKey) => layers.find((item) => item.id === id)!;
  const toggleLayer = (id: LayerKey) => setLayers((current) => current.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));
  const setOpacity = (id: LayerKey, opacity: number) => setLayers((current) => current.map((item) => item.id === id ? { ...item, opacity } : item));
  const runAnalysis = () => {
    setExplainer("loading");
    window.setTimeout(() => setExplainer("ready"), 900);
  };
  const selectCity = (nextCity: CityKey) => {
    setCity(nextCity);
    setCityMenuOpen(false);
    setActiveFinding(1);
    setExplainer("ready");
  };

  return <main className="app-shell">
    <header className="topbar">
      <button className="icon-button hamburger" aria-label="Menu"><Menu /></button>
      <div className="brand">Temporal Drift Explorer</div>
      <div className="market-badge">Canada + India only</div>
      <div className="city-search-wrap">
        <button className="search" onClick={() => setCityMenuOpen(!cityMenuOpen)}>
          <Search size={15} /><span>{profile.city}, {profile.countryCode}</span><ChevronDown size={14} />
        </button>
        {cityMenuOpen && <div className="city-menu">
          {(Object.keys(cityProfiles) as CityKey[]).map((cityId) => {
            const option = cityProfiles[cityId];
            return <button key={cityId} className={cityId === city ? "city-selected" : ""} onClick={() => selectCity(cityId)}>
              <strong>{option.city}</strong><span>{option.country}</span>
            </button>;
          })}
          <div>Exclusive launch markets: Canada + India</div>
        </div>}
      </div>
      <button className={`compare-toggle ${compare ? "active" : ""}`} onClick={() => setCompare(!compare)}>Compare Mode <span>{compare ? "ON" : "OFF"}</span></button>
      <div className="year-compare"><ChevronLeft size={14} /> <b>2012</b><span>→</span><b>{year}</b><ChevronRight size={14} /></div>
      <button className="top-action"><Share2 size={16} /> Share</button>
      <button className="export"><Download size={16} /> Export <ChevronDown size={14} /></button>
    </header>

    <section className="workspace">
      <nav className="rail">
        <button className="rail-active"><Layers3 /></button><BarChart3 /><MessageSquareText /><Bookmark /><Settings />
      </nav>

      <aside className={`layers-panel ${leftOpen ? "" : "panel-hidden"}`}>
        <div className="panel-title">Layers <ChevronDown size={15} /></div>
        {layers.map((item) => <div className="layer-row" key={item.id}>
          <div className="layer-heading">
            <button className={`check ${item.enabled ? "checked" : ""}`} onClick={() => toggleLayer(item.id)}>✓</button>
            <strong>{item.label}</strong>
            {item.id === "business" ? <BarChart3 size={15} /> : item.id === "demographics" ? <Users size={15} /> : <Layers3 size={15} />}
          </div>
          <label className="opacity">Opacity <input type="range" min="0" max="100" value={item.opacity} onChange={(event) => setOpacity(item.id, Number(event.target.value))} /><span>{item.opacity}%</span></label>
        </div>)}
        <div className="legend">
          <div className="panel-title">Layer legend <ChevronDown size={15} /></div>
          <em>Land-use zoning</em>
          {[["Commercial", "#e8614e"], ["Mixed Use", "#df923e"], ["Industrial", "#755ca6"], ["Residential", "#d4b637"], ["Public / Institutional", "#4671ad"], ["Parks / Open Space", "#67965f"], ["Vacant / Other", "#999c9b"]].map(([label, color]) =>
            <div className="legend-item" key={label}><i style={{ background: color }} />{label}</div>)}
          <em>Business density (per acre)</em>
          <div className="density-gradient" /><div className="gradient-labels"><span>Low</span><span>High</span></div>
        </div>
      </aside>

      <button className="collapse-left" onClick={() => setLeftOpen(!leftOpen)}><ChevronLeft size={16} /></button>

      <section className="map-stage">
        <img className="map-image" src={profile.asset} alt={profile.alt} />
        <svg className="map-overlays" viewBox="0 0 100 100" preserveAspectRatio="none">
          {layer("zoning").enabled && <g opacity={layer("zoning").opacity / 150}>
            {zoningParcels.map(([points, fill]) => <polygon key={points} points={points} fill={fill} stroke="rgba(255,255,255,.48)" strokeWidth=".22" />)}
          </g>}
          {layer("demographics").enabled && <g opacity={layer("demographics").opacity / 180}>
            <rect x="72" width="28" height="100" fill="#d1b83d" /><rect width="32" height="100" fill="#4278a2" />
          </g>}
          {layer("business").enabled && <g opacity={layer("business").opacity / 100}>
            <path d="M46 -2 C43 16 46 31 47 46 C50 60 51 76 54 102" fill="none" stroke="url(#heat)" strokeWidth={Math.max(7, snapshot.businessIntensity / 7)} strokeLinecap="round" />
            <defs><linearGradient id="heat" x1="0" x2="1"><stop stopColor="#6c3e9f" /><stop offset=".46" stopColor="#d54f54" /><stop offset=".8" stopColor="#ff9d49" /><stop offset="1" stopColor="#ffe46a" /></linearGradient></defs>
          </g>}
          <path className="corridor" d="M39 5 L54 3 L57 21 L55 39 L59 58 L64 77 L63 96 L49 98 L47 79 L43 62 L42 43 L40 24 Z" />
        </svg>
        {compare && <div className="swipe" style={{ left: `${swipe}%` }}><div className="before-after"><span>Before<br /><b>2012</b></span><span>After<br /><b>{year}</b></span></div><button>‹ ›</button></div>}
        <input
          className="swipe-range"
          aria-label="Before and after comparison divider"
          type="range"
          min="8"
          max="92"
          value={swipe}
          onChange={(event) => setSwipe(Number(event.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "ew-resize" }}
        />
        {profile.findings.map((finding) => <button key={finding.id} style={{ left: `${finding.position.x}%`, top: `${finding.position.y}%` }} onClick={() => setActiveFinding(finding.id)} className={`map-pin ${activeFinding === finding.id ? "pin-active" : ""}`}>{finding.id}</button>)}
        <div className="map-label label-one">{profile.labels[0]}</div><div className="map-label label-two">{profile.labels[1]}</div><div className="map-label label-three">{profile.labels[2]}</div>
        <div className="map-tools"><button><Plus /></button><button><Minus /></button><button><LocateFixed /></button><button className="map-3d">3D</button></div>
        <div className="scale">300 m</div>
      </section>

      <button className="collapse-right" onClick={() => setRightOpen(!rightOpen)}><ChevronRight size={16} /></button>
      <aside className={`explainer ${rightOpen ? "" : "panel-hidden"}`}>
        <div className="explainer-heading"><Sparkles size={18} /> <h2>Spatial Explainer</h2><ChevronDown size={16} /><X size={17} /></div>
        <label className="question-label">Your question</label>
        <button className="question" onClick={runAnalysis}>{profile.question}</button>
        <div className="asked">Seeded analysis · click question to refresh</div>
        <div className="findings-title">Findings (anchored to map)</div>
        {explainer === "loading" ? <div className="loading"><Sparkles /> Analyzing temporal signals…</div> : <div className="findings">
          {profile.findings.map((finding) => <button className={`finding ${activeFinding === finding.id ? "selected" : ""}`} key={finding.id} onClick={() => setActiveFinding(finding.id)}>
            <span>{finding.id}</span><div><strong>{finding.title}</strong><p>{finding.body}</p></div>
          </button>)}
        </div>}
        <div className="evidence-heading">Causal evidence <CircleHelp size={14} /></div>
        {profile.evidence.map((series) => <div className="evidence-row" key={series.label}>
          <div className="evidence-label">{series.label}</div><div className="chart-row"><b>{series.startValue}</b><Sparkline series={series} /><b>{series.endValue}</b><small>Source:<br />{series.source}</small></div>
        </div>)}
        <div className="ai-note">AI-generated. Verify important information.</div>
      </aside>
    </section>

    <footer className="timeline">
      <div className="timeline-events">{profile.events.map((event) => <button key={event.year} className={`event ${event.tone}`} style={{ left: `${((event.year - 2008) / 16) * 100}%` }} onClick={() => setYear(event.year)}><span>{event.year}</span><em>{event.title}</em><i /></button>)}</div>
      <div className="timeline-bottom">
        <button className="play" onClick={() => setPlaying(!playing)}>{playing ? <Pause /> : <Play />}</button>
        <button className="mini"><ChevronLeft /></button><button className="mini"><ChevronRight /></button>
        <span className="speed">1x <ChevronDown size={13} /></span>
        <div className="range-wrap"><input aria-label="Timeline year" type="range" min="2008" max="2024" value={year} onChange={(event) => setYear(Number(event.target.value))} /><div className="years">{years.map((item) => <span key={item}>{item}</span>)}</div></div>
        <button className="go-year"><CalendarDays size={16} /> Go to year</button>
      </div>
      <div className="comparison">Comparison: <b>2012 → {year}</b><ChevronDown size={14} /></div>
    </footer>
  </main>;
}

export default App;
