import { useEffect, useRef, useState } from 'react';
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Copy,
  Clock3,
  FileText,
  Gauge,
  ExternalLink,
  ImagePlus,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  LogOut,
  Menu,
  PackageCheck,
  Play,
  Settings,
  ShieldCheck,
  Store,
  Upload,
  X,
} from 'lucide-react';
import '../admin.css';

const navigation = [
  { to: '/admin/overview', label: 'Overview', icon: Gauge },
  { to: '/admin/product-radar', label: 'Product Radar', icon: LayoutDashboard },
  { to: '/admin/product-radar/events', label: 'Events calendar', icon: CalendarDays },
  { to: '/admin/listings', label: 'Listings', icon: FileText },
  { to: '/admin/settings/integrations', label: 'Settings', icon: Settings },
];

let csrfToken = '';
async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function AdminApp() {
  return (
    <div className="admin-root">
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="*" element={<AdminGate />} />
      </Routes>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ username: '', password: '' });
  const [state, setState] = useState({ loading: false, error: '' });
  useEffect(() => {
    api('/api/admin/session')
      .then((data) => {
        csrfToken = data.csrfToken;
        if (data.authenticated) navigate('/admin/product-radar', { replace: true });
      })
      .catch(() =>
        setState((s) => ({
          ...s,
          error: 'The secure login service is unavailable.',
        }))
      );
  }, [navigate]);
  async function submit(event) {
    event.preventDefault();
    setState({ loading: true, error: '' });
    try {
      await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const next = params.get('next');
      navigate(next?.startsWith('/admin/') && !next.startsWith('//') ? next : '/admin/product-radar', {
        replace: true,
      });
    } catch (error) {
      setState({ loading: false, error: error.message });
    }
  }
  return (
    <main className="admin-login">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-mark">
          <ShieldCheck size={28} />
        </div>
        <p className="admin-eyebrow">Private operations</p>
        <h1 id="login-title">Gadjit Prints Admin</h1>
        <p>Sign in with your administrator account. Credentials are verified only on the server.</p>
        <form onSubmit={submit}>
          <Field label="Username">
            <input
              autoComplete="username"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          {state.error && <Notice tone="error">{state.error}</Notice>}
          <button className="admin-button primary" disabled={state.loading}>
            {state.loading ? <LoaderCircle className="spin" size={18} /> : <ShieldCheck size={18} />} Sign in securely
          </button>
        </form>
        <small>Protected with server sessions, rate limiting, and request verification.</small>
      </section>
    </main>
  );
}

function AdminGate() {
  const location = useLocation();
  const [session, setSession] = useState({
    loading: true,
    authenticated: false,
  });
  useEffect(() => {
    api('/api/admin/session')
      .then((data) => {
        csrfToken = data.csrfToken;
        setSession({ loading: false, ...data });
      })
      .catch(() => setSession({ loading: false, authenticated: false }));
  }, [location.pathname]);
  if (session.loading) return <AdminLoading />;
  if (!session.authenticated)
    return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <AdminShell session={session} />;
}

function AdminShell({ session }) {
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  async function signOut() {
    await api('/api/admin/logout', { method: 'POST' });
    navigate('/admin/login', { replace: true });
  }
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-content">
        Skip to content
      </a>
      <aside className={`admin-sidebar ${menu ? 'open' : ''}`}>
        <div className="admin-brand">
          <img src="/brand/gadjitprints-logo.webp" alt="" />
          <div>
            <strong>Gadjit Prints</strong>
            <span>Operations beta</span>
          </div>
          <button className="icon-button mobile-close" onClick={() => setMenu(false)} aria-label="Close menu">
            <X />
          </button>
        </div>
        <nav aria-label="Admin navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMenu(false)}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="health-dot" /> Private beta{' '}
          <button onClick={signOut}>
            <LogOut size={17} /> Log out
          </button>
        </div>
      </aside>
      {menu && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMenu(false)} />}
      <div className="admin-stage">
        <header className="admin-mobilebar">
          <button className="icon-button menu-button" onClick={() => setMenu(true)} aria-label="Open navigation">
            <Menu />
          </button>
          <strong>Gadjit Prints Admin</strong>
        </header>
        <div className="draft-only-banner">
          <ShieldCheck size={17} /> Beta creates Etsy drafts only. Final review and publishing must be completed in
          Etsy.
        </div>
        <main id="admin-content" className="admin-content">
          <Routes>
            <Route path="overview" element={<Overview />} />
            <Route path="product-radar" element={<RadarDashboard />} />
            <Route path="product-radar/events" element={<EventsPage />} />
            <Route path="listings" element={<ListingsPage />} />
            <Route path="listings/:id" element={<ListingEditor config={session.config} />} />
            <Route
              path="settings/integrations"
              element={<Integrations config={session.config} connection={session.etsyConnection} />}
            />
            <Route path="*" element={<Navigate to="/admin/product-radar" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function useDashboard() {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const load = () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    api('/api/admin/dashboard')
      .then((data) => setState({ loading: false, data, error: '' }))
      .catch((error) => setState({ loading: false, data: null, error: error.message }));
  };
  useEffect(load, []);
  return { ...state, reload: load };
}

function Overview() {
  const { loading, data, error, reload } = useDashboard();
  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} retry={reload} />;
  const products = data.products ?? [];
  const ready = products.filter((p) => p.review === 'approved' && p.verified === 'verified').length;
  return (
    <>
      <PageHeader
        eyebrow="Operations workspace"
        title="Overview"
        copy="Your weekly snapshot of opportunities, event timing, and listing readiness."
      />
      <section className="overview-summary" aria-label="Operations summary">
        <div className="summary-group">
          <header>
            <CalendarDays size={17} />
            <div>
              <h2>Event timing</h2>
              <p>What to make and prepare for</p>
            </div>
          </header>
          <div className="summary-group-grid">
            <Metric
              icon={Activity}
              label="Active events"
              value={data.events.filter((e) => e.status === 'active').length}
              note="Selling windows open"
            />
            <Metric
              icon={Clock3}
              label="Coming next"
              value={data.events.filter((e) => e.status === 'coming_soon').length}
              note="Prepare production"
            />
          </div>
        </div>
        <div className="summary-group">
          <header>
            <FileText size={17} />
            <div>
              <h2>Listing workflow</h2>
              <p>What is ready to move forward</p>
            </div>
          </header>
          <div className="summary-group-grid">
            <Metric icon={PackageCheck} label="Ready to draft" value={ready} note="Rights verified" />
            <Metric icon={FileText} label="Listing drafts" value={data.listings.length} note="In your workspace" />
          </div>
        </div>
      </section>
      <div className="overview-grid">
        <Section title="Next best actions" subtitle="Move the weekly workflow forward">
          <div className="quick-actions">
            <NavLink to="/admin/product-radar">
              <LayoutDashboard />
              <span>
                <strong>Review Product Radar</strong>
                <small>Compare and approve current opportunities.</small>
              </span>
              <ChevronRight />
            </NavLink>
            <NavLink to="/admin/product-radar/events">
              <CalendarDays />
              <span>
                <strong>Check event timing</strong>
                <small>Prioritize launches by urgency and lead time.</small>
              </span>
              <ChevronRight />
            </NavLink>
            <NavLink to="/admin/listings">
              <FileText />
              <span>
                <strong>Finish listing drafts</strong>
                <small>Review copy, media, rights, and publishing gates.</small>
              </span>
              <ChevronRight />
            </NavLink>
          </div>
        </Section>
        <Section
          title="Radar status"
          subtitle={
            data.lastSuccessfulRun
              ? `Last successful run ${formatDate(data.lastSuccessfulRun.date)}`
              : 'No successful runs yet'
          }
        >
          <div className="overview-status">
            <Status value={data.lastSuccessfulRun?.status ?? 'pending'} />
            <p>
              {data.fixtureMode
                ? 'Sample mode is active. Live research and external writes remain disabled.'
                : 'Radar is connected to live research sources.'}
            </p>
            <NavLink className="admin-link" to="/admin/settings/integrations">
              Review integration settings <ChevronRight size={16} />
            </NavLink>
          </div>
        </Section>
      </div>
    </>
  );
}

function RadarDashboard() {
  const { loading, data, error, reload } = useDashboard();
  const [runState, setRunState] = useState(null);
  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} retry={reload} />;
  const recommendations = (data.products ?? [])
    .filter(isExternalResearchRecommendation)
    .sort((a, b) => b.score - a.score);
  async function runRadar() {
    if (runState?.kind === 'running') return;
    setRunState({ kind: 'running', message: data.fixtureMode ? 'Starting a safe sample run…' : 'Starting Radar…' });
    try {
      const result = await api('/api/admin/radar/run', { method: 'POST' });
      if (!data.fixtureMode && result.run?.id) {
        setRunState({ kind: 'running', message: 'Radar is researching external model sources…' });
        for (let attempt = 0; attempt < 12; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
          const statusResult = await api(`/api/admin/radar/runs/${result.run.id}`);
          if (statusResult.run?.status === 'completed') {
            setRunState({ kind: 'success', message: 'Research complete. External recommendations are ready below.' });
            reload();
            return;
          }
          if (['failed', 'partial'].includes(statusResult.run?.status)) {
            throw new Error('Radar research did not complete. Check the recent run details and try again.');
          }
        }
        setRunState({
          kind: 'neutral',
          message: 'Research is still running. Refresh this page in a moment to see the recommendations.',
        });
        reload();
        return;
      }
      setRunState({
        kind: 'success',
        message: result.duplicate
          ? 'This hour’s Radar run already exists; no duplicate was created.'
          : data.fixtureMode
            ? 'Sample run completed. No live sources were searched because fixture mode is enabled.'
            : 'Radar started. New recommendations will appear after the research run completes.',
      });
      reload();
    } catch (e) {
      setRunState({ kind: 'error', message: e.message });
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Weekly opportunity intelligence"
        title="Product Radar"
        copy="External print recommendations found through Radar research, linked directly to their original sources."
        actions={
          <div className="radar-run-action">
            <button className="admin-button primary" onClick={runRadar} disabled={runState?.kind === 'running'}>
              {runState?.kind === 'running' ? <LoaderCircle className="spin" size={17} /> : <Play size={17} />}
              {runState?.kind === 'running' ? 'Starting…' : data.fixtureMode ? 'Run sample Radar' : 'Run Radar now'}
            </button>
            <small>
              {data.fixtureMode
                ? 'Sample mode: records a test run without searching the web.'
                : 'Searches for current models and adds them to the review queue.'}
            </small>
          </div>
        }
      />
      {runState && (
        <Notice tone={runState.kind === 'running' ? 'neutral' : runState.kind} live>
          {runState.message}
        </Notice>
      )}
      <section className="metric-grid">
        <Metric
          icon={PackageCheck}
          label="Research results"
          value={recommendations.length}
          note="External sources only"
        />
        <Metric
          icon={ShieldCheck}
          label="License verified"
          value={recommendations.filter((p) => p.verified === 'verified').length}
          note="Human reviewed"
        />
        <Metric
          icon={AlertTriangle}
          label="Needs review"
          value={recommendations.filter((p) => p.review === 'needs_review' || p.verified !== 'verified').length}
          note="License or IP check"
        />
        <Metric
          icon={Clock3}
          label="Latest research"
          value={data.lastSuccessfulRun ? formatShortDate(data.lastSuccessfulRun.date) : '—'}
          note="Last successful run"
        />
      </section>
      <Section
        title="Recommended prints"
        subtitle="Independent external models found by Radar—never Gadjit Prints catalog products"
      >
        <div className="research-list">
          {recommendations.length ? (
            recommendations.map((product, index) => (
              <ResearchRecommendation key={product.id} product={product} rank={index + 1} />
            ))
          ) : (
            <EmptyState
              title="No external research recommendations yet"
              copy={
                data.fixtureMode
                  ? 'Sample mode does not perform live research. Configure OpenAI, turn off fixture mode, and run Radar to populate this list with real source links.'
                  : 'Run Radar to research current external models and add their original source links here.'
              }
            />
          )}
        </div>
      </Section>
      <Section
        title="Recent radar runs"
        subtitle={
          data.lastSuccessfulRun ? `Last success ${formatDate(data.lastSuccessfulRun.date)}` : 'No successful runs yet'
        }
      >
        <div className="run-list">
          {data.runs.map((run) => (
            <div key={run.id}>
              <Status value={run.status} />
              <span>{formatDate(run.date)}</span>
              <strong>{run.model}</strong>
              <p>{run.summary}</p>
            </div>
          ))}
        </div>
      </Section>
      {data.fixtureMode && (
        <Notice tone="neutral">
          Fixture mode is active. No OpenAI request was made; external recommendations remain disabled until configured.
        </Notice>
      )}
    </>
  );
}

function ResearchRecommendation({ product, rank }) {
  return (
    <a className="research-item" href={product.source} target="_blank" rel="noreferrer">
      <span className="research-rank mono">{String(rank).padStart(2, '0')}</span>
      <div className="research-copy">
        <div className="card-kicker">
          <Status value={product.review} />
          <span className="mono">{product.score}/100</span>
        </div>
        <h3>{product.title}</h3>
        <p>{product.concept}</p>
        <div className="card-meta">
          <span>{product.creator}</span>
          <span>{product.hook}</span>
          <span>{product.complexity} complexity</span>
          <span>{product.printTime ? `${product.printTime} min` : 'Time unknown'}</span>
          <span>{product.license}</span>
        </div>
      </div>
      <span className="research-source">
        <small>{sourceHostname(product.source)}</small>
        Open original source <ExternalLink size={16} />
      </span>
    </a>
  );
}

function EventsPage() {
  const { loading, data, error, reload } = useDashboard();
  const [params, setParams] = useSearchParams();
  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} retry={reload} />;
  const status = params.get('status') || 'all';
  const region = params.get('region') || 'all';
  const events = data.events.filter(
    (e) => (status === 'all' || e.status === status) && (region === 'all' || e.region === region)
  );
  const update = (key, value) => {
    const p = new URLSearchParams(params);
    value === 'all' ? p.delete(key) : p.set(key, value);
    setParams(p);
  };
  return (
    <>
      <PageHeader
        eyebrow="Worldwide planning calendar"
        title="Event intelligence"
        copy="Editable sample opportunities with dates, source evidence, sensitivity context, and generic product angles."
      />
      <div className="filter-bar">
        <Select
          label="Status"
          value={status}
          onChange={(e) => update('status', e.target.value)}
          options={[
            ['all', 'All statuses'],
            ['active', 'Active'],
            ['coming_soon', 'Coming soon'],
            ['plan_early', 'Plan early'],
            ['archived', 'Archived'],
          ]}
        />
        <Select
          label="Region"
          value={region}
          onChange={(e) => update('region', e.target.value)}
          options={[['all', 'All regions'], ...[...new Set(data.events.map((e) => e.region))].map((v) => [v, v])]}
        />
      </div>
      <div className="event-table" role="list">
        {events.map((e) => (
          <article key={e.id} role="listitem">
            <div className="event-date">
              <strong>
                {new Date(`${e.startDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </strong>
              <span>{new Date(`${e.startDate}T12:00:00`).getFullYear()}</span>
            </div>
            <div>
              <div className="event-title">
                <h2>{e.name}</h2>
                <Status value={e.status} />
                <span className={`urgency urgency-${eventUrgency(e)}`}>{eventCountdown(e)}</span>
                {e.sample && <span className="sample-badge">Sample data</span>}
              </div>
              <p>{e.summary}</p>
              <dl>
                <div>
                  <dt>Region</dt>
                  <dd>{e.region}</dd>
                </div>
                <div>
                  <dt>Lead time</dt>
                  <dd>{e.leadDays} days</dd>
                </div>
                <div>
                  <dt>Window</dt>
                  <dd>
                    {e.startDate} → {e.endDate}
                  </dd>
                </div>
                <div>
                  <dt>Verified</dt>
                  <dd>{e.verified}</dd>
                </div>
              </dl>
              <div className="event-notes">
                <p>
                  <strong>Opportunities:</strong> {e.opportunities.join(' · ')}
                </p>
                <p>
                  <strong>Sensitivity:</strong> {e.sensitivity}
                </p>
                <p>
                  <strong>IP:</strong> {e.ip}
                </p>
              </div>
              <a className="admin-link" href={e.source} target="_blank" rel="noreferrer">
                Open official source <ChevronRight size={15} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function ListingsPage() {
  const { loading, data, error, reload } = useDashboard();
  const [params, setParams] = useSearchParams();
  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} retry={reload} />;
  const status = params.get('status') || 'all';
  const listings = data.listings.filter((l) => status === 'all' || l.status === status);
  return (
    <>
      <PageHeader
        eyebrow="Human-reviewed listing workflow"
        title="Listing drafts"
        copy="Prepare internal drafts, approve real photography, and send only confirmed drafts to Etsy."
      />
      <div className="filter-bar">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setParams(e.target.value === 'all' ? {} : { status: e.target.value })}
          options={[
            ['all', 'All listings'],
            ['internal_draft', 'Internal draft'],
            ['ready', 'Ready'],
            ['etsy_draft', 'Etsy draft'],
            ['partial', 'Partial upload'],
            ['failed', 'Failed'],
          ]}
        />
      </div>
      <div className="listing-list" role="table" aria-label="Listing drafts">
        <div className="listing-head" role="row">
          <span role="columnheader">Listing</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Price</span>
          <span role="columnheader">Quantity</span>
          <span role="columnheader">Updated</span>
          <span aria-hidden="true" />
        </div>
        {listings.map((l) => (
          <NavLink key={l.id} to={`/admin/listings/${l.id}`} role="row">
            <div className="listing-icon">
              <FileText />
            </div>
            <div className="listing-name" role="cell">
              <h2>{l.title}</h2>
              <p className="mono">{l.sku}</p>
            </div>
            <div role="cell">
              <Status value={l.status} />
            </div>
            <strong role="cell">${Number(l.price).toFixed(2)}</strong>
            <span role="cell">{l.quantity}</span>
            <span role="cell">{formatDate(l.updatedAt ?? l.createdAt)}</span>
            <ChevronRight />
          </NavLink>
        ))}
        {!listings.length && (
          <EmptyState
            title="No listing drafts"
            copy="Approved radar recommendations can be converted into internal drafts."
          />
        )}
      </div>
    </>
  );
}

function ListingEditor({ config }) {
  const { id } = useParams();
  const dashboard = useDashboard();
  const [listing, setListing] = useState(null);
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dialogRef = useRef(null);
  const confirmTriggerRef = useRef(null);
  useEffect(() => {
    if (dashboard.data) {
      const fixture = dashboard.data.listings.find((l) => l.id === id);
      if (fixture)
        setListing({
          ...fixture,
          personalizationInstructions: '',
          variations: { baseColors: [], textColors: [], bundles: [] },
          processingRecommendation: '',
          shippingNotes: '',
          safetyPrivacyNotes: '',
          mediaPlan: {},
        });
      else
        api(`/api/admin/listings/${id}`)
          .then((d) => setListing(d.listing))
          .catch((e) => setMessage(e.message));
    }
  }, [dashboard.data, id]);
  useEffect(() => {
    if (!confirm) return undefined;
    const focusable = [...(dialogRef.current?.querySelectorAll('button, [href], input, select, textarea') ?? [])];
    const trigger = confirmTriggerRef.current;
    focusable[0]?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setConfirm(false);
        trigger?.focus();
        return;
      }
      if (event.key !== 'Tab' || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [confirm]);
  if (dashboard.loading || !listing) return <PageSkeleton />;
  const set = (key, value) => setListing({ ...listing, [key]: value });
  const tags = listing.tags ?? [];
  async function save() {
    try {
      await api(`/api/admin/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(listing),
      });
      setMessage('Draft saved.');
    } catch (e) {
      setMessage(e.message);
    }
  }
  async function createDraft() {
    try {
      const result = await api(`/api/admin/listings/${id}/etsy-draft`, {
        method: 'POST',
        body: JSON.stringify({ confirmed: true }),
      });
      setMessage(result.partial ? 'Etsy draft created; one or more images need retry.' : 'Etsy draft created safely.');
      setConfirm(false);
    } catch (e) {
      setMessage(e.message);
      setConfirm(false);
    }
  }
  async function duplicate() {
    try {
      const result = await api(`/api/admin/listings/${id}/duplicate`, {
        method: 'POST',
        body: '{}',
      });
      window.location.assign(`/admin/listings/${result.listing.id}`);
    } catch (e) {
      setMessage(e.message);
    }
  }
  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await api(`/api/admin/listings/${id}/assets`, {
        method: 'POST',
        body: JSON.stringify({
          dataUrl,
          kind: 'actual_photo',
          altText: `Actual product photograph for ${listing.title}`,
          rightsNote: 'Uploaded by Gadjit Prints administrator',
        }),
      });
      setListing({
        ...listing,
        assets: [...(listing.assets ?? []), result.asset],
      });
      setMessage('Image uploaded for approval.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setUploading(false);
    }
  }
  const eligible = (listing.assets ?? []).some((a) => a.kind === 'actual_photo' && a.approved);
  return (
    <>
      <PageHeader
        eyebrow="Internal listing editor"
        title={listing.title}
        copy="Validate copy, fulfillment settings, rights, and actual photography before creating an Etsy draft."
        actions={
          <>
            <button className="admin-button" onClick={save}>
              Save draft
            </button>
            <button className="admin-button" onClick={duplicate}>
              <Copy size={17} /> Duplicate
            </button>
            <button
              ref={confirmTriggerRef}
              className="admin-button primary"
              onClick={() => setConfirm(true)}
              disabled={!config.etsyDraftsEnabled || !eligible}
            >
              <Store size={17} />
              Create Etsy Draft
            </button>
          </>
        }
      />
      {message && (
        <Notice
          tone={
            message.includes('saved') || message.includes('created') || message.includes('uploaded')
              ? 'success'
              : 'error'
          }
          live
        >
          {message}
        </Notice>
      )}
      <div className="editor-layout">
        <div className="editor-form">
          <EditorSection title="Listing copy">
            <Field label="Title" hint={`${listing.title.length}/140`}>
              <input maxLength={140} value={listing.title} onChange={(e) => set('title', e.target.value)} />
            </Field>
            <Field label="Description">
              <textarea rows={9} value={listing.description} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <Field label="Tags" hint={`${tags.length}/13 · 20 characters each`}>
              <div className="tag-editor">
                {Array.from({ length: 13 }, (_, i) => (
                  <input
                    key={i}
                    aria-label={`Tag ${i + 1}`}
                    maxLength={20}
                    value={tags[i] ?? ''}
                    onChange={(e) => {
                      const next = [...tags];
                      next[i] = e.target.value;
                      set(
                        'tags',
                        next.filter((tag, index) => tag || index <= i)
                      );
                    }}
                  />
                ))}
              </div>
            </Field>
          </EditorSection>
          <EditorSection title="Inventory & production">
            <div className="field-grid">
              <Field label="Price">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={listing.price}
                  onChange={(e) => set('price', e.target.value)}
                />
              </Field>
              <Field label="Quantity">
                <input
                  type="number"
                  min="1"
                  value={listing.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                />
              </Field>
              <Field label="SKU">
                <input
                  className="mono"
                  maxLength={32}
                  value={listing.sku}
                  onChange={(e) => set('sku', e.target.value)}
                />
              </Field>
              <Field label="Materials">
                <input
                  value={(listing.materials ?? []).join(', ')}
                  onChange={(e) =>
                    set(
                      'materials',
                      e.target.value
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </Field>
              <Field label="Shipping profile ID">
                <input
                  className="mono"
                  value={listing.shippingProfileId ?? ''}
                  onChange={(e) => set('shippingProfileId', e.target.value)}
                />
              </Field>
              <Field label="Readiness state ID">
                <input
                  className="mono"
                  value={listing.readinessStateId ?? ''}
                  onChange={(e) => set('readinessStateId', e.target.value)}
                />
              </Field>
              <Field label="Etsy taxonomy ID">
                <input
                  className="mono"
                  value={listing.taxonomyId ?? ''}
                  onChange={(e) => set('taxonomyId', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Personalization prompt">
              <textarea
                value={listing.personalizationInstructions ?? ''}
                onChange={(e) => set('personalizationInstructions', e.target.value)}
              />
            </Field>
            <Field label="Variations" hint="Base colors, text colors, bundle quantities and prices">
              <textarea
                value={JSON.stringify(listing.variations ?? {}, null, 2)}
                onChange={(e) => {
                  try {
                    set('variations', JSON.parse(e.target.value));
                  } catch {
                    setMessage('Variations must be valid JSON.');
                  }
                }}
              />
            </Field>
          </EditorSection>
          <EditorSection title="Media & rights">
            <div className="upload-row">
              <label className={`admin-button ${uploading ? 'disabled' : ''}`}>
                <Upload size={17} />
                {uploading ? 'Uploading…' : 'Upload actual photo'}
                <input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={uploadImage}
                  disabled={uploading}
                />
              </label>
              <span>JPEG, PNG, or WebP · max 8 MB · min 600×600</span>
            </div>
            <div className="media-grid">
              {(listing.assets ?? []).map((a, index) => (
                <div className="media-item" key={a.id}>
                  <img src={a.url} alt={a.altText} />
                  <span>{a.kind.replaceAll('_', ' ')}</span>
                  <strong>{a.approved ? 'Approved' : 'Approval required'}</strong>
                  <div>
                    <button aria-label={`Move image ${index + 1} earlier`} disabled={!index}>
                      <ArrowUpDown size={15} />
                    </button>
                  </div>
                </div>
              ))}
              {!(listing.assets ?? []).length && (
                <EmptyState
                  title="No listing media"
                  copy="At least one approved actual product photograph is required. Generated renders may only supplement it."
                />
              )}
            </div>
          </EditorSection>
          <EditorSection title="Review gates">
            <div className="review-grid">
              <ReviewItem ok={true} title="License review" copy="Recommendation record must be verified in Radar." />
              <ReviewItem
                ok={true}
                title="IP-risk review"
                copy="No protected character, logo, team, or branded design."
              />
              <ReviewItem
                ok={eligible}
                title="Actual product photo"
                copy="At least one approved real product photograph."
              />
              <ReviewItem
                ok={config.etsyDraftsEnabled}
                title="External writes"
                copy="ETSY_DRAFTS_ENABLED must be true in Preview."
              />
            </div>
          </EditorSection>
        </div>
        <aside className="listing-preview">
          <span className="admin-eyebrow">Etsy card preview</span>
          <div className="preview-image">
            {listing.assets?.[0] ? <img src={listing.assets[0].url} alt={listing.assets[0].altText} /> : <ImagePlus />}
          </div>
          <h2>{listing.title}</h2>
          <strong>${Number(listing.price).toFixed(2)}</strong>
          <p>Made to order · Qty {listing.quantity}</p>
          <Status value={listing.status} />
        </aside>
      </div>
      {confirm && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setConfirm(false)}
        >
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            ref={dialogRef}
          >
            <div className="dialog-icon">
              <Store />
            </div>
            <h2 id="confirm-title">Create an Etsy draft?</h2>
            <p>
              This sends the approved listing and media to Etsy as a draft only. It will not publish or activate the
              listing.
            </p>
            <Notice tone="neutral">Final review and publishing must be completed in Etsy.</Notice>
            <div>
              <button className="admin-button" onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button className="admin-button primary" onClick={createDraft}>
                Confirm draft creation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Integrations({ config, connection }) {
  const [message, setMessage] = useState('');
  async function connect() {
    try {
      const data = await api('/api/admin/etsy/connect', {
        method: 'POST',
        body: '{}',
      });
      window.location.assign(data.authorizationUrl);
    } catch (e) {
      setMessage(e.message);
    }
  }
  async function disconnect() {
    try {
      await api('/api/admin/etsy/disconnect', { method: 'POST', body: '{}' });
      setMessage('Etsy connection removed and stored tokens cleared.');
    } catch (e) {
      setMessage(e.message);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Server-side connections"
        title="Integrations"
        copy="External APIs are isolated to Preview and disabled until every required environment variable is configured."
      />
      {message && <Notice tone={message.includes('removed') ? 'success' : 'error'}>{message}</Notice>}
      <div className="integration-grid">
        <IntegrationCard
          icon={Activity}
          title="OpenAI Product Radar"
          configured={!config.radarFixtureMode}
          enabled={config.radarCronEnabled}
          copy={
            config.radarFixtureMode
              ? 'Fixture mode: no paid API call will be made.'
              : 'Responses API with strict structured output and current-source search.'
          }
        >
          <span className="mono">OPENAI_MODEL · RADAR_CRON_ENABLED</span>
        </IntegrationCard>
        <IntegrationCard
          icon={Store}
          title="Etsy Open API v3"
          configured={config.etsyConfigured}
          enabled={config.etsyDraftsEnabled}
          copy={
            connection?.connected
              ? `Connected to verified shop: ${connection.shopName ?? 'Etsy shop'}. Tokens refresh server-side.`
              : 'OAuth 2.0 with PKCE, encrypted refreshable tokens, minimal scopes, and draft-only writes.'
          }
        >
          <div className="button-row">
            <button className="admin-button primary" onClick={connect} disabled={!config.etsyConfigured}>
              Connect Etsy
            </button>
            <button className="admin-button danger" onClick={disconnect}>
              Disconnect
            </button>
          </div>
        </IntegrationCard>
        <IntegrationCard
          icon={Upload}
          title="Product media"
          configured={config.storageConfigured}
          enabled={config.storageConfigured}
          copy="Validated manual uploads stored under safe generated names in Vercel Blob."
        >
          <span className="mono">BLOB_READ_WRITE_TOKEN</span>
        </IntegrationCard>
      </div>
      <Section title="Required shop settings" subtitle="Choose these after OAuth connection">
        <div className="settings-placeholder">
          <Field label="Verified Etsy shop">
            <select disabled>
              <option>Select after connection</option>
            </select>
          </Field>
          <Field label="Shipping profile">
            <select disabled>
              <option>Sync from Etsy</option>
            </select>
          </Field>
          <Field label="Processing / readiness">
            <select disabled>
              <option>Sync from Etsy</option>
            </select>
          </Field>
          <Field label="Taxonomy category">
            <select disabled>
              <option>Choose per listing</option>
            </select>
          </Field>
        </div>
      </Section>
    </>
  );
}

function IntegrationCard({ icon: Icon, title, configured, enabled, copy, children }) {
  return (
    <article className="integration-card">
      <div className="integration-icon">
        <Icon />
      </div>
      <div>
        <div className="integration-title">
          <h2>{title}</h2>
          <Status value={configured ? 'configured' : 'not_configured'} />
        </div>
        <p>{copy}</p>
        <div className="integration-state">
          <span className={enabled ? 'on' : 'off'} /> Writes {enabled ? 'enabled' : 'disabled'}
        </div>
        {children}
      </div>
    </article>
  );
}

function PageHeader({ eyebrow, title, copy, actions }) {
  return (
    <header className="admin-page-header">
      <div>
        <p className="admin-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
function Section({ title, subtitle, children }) {
  return (
    <section className="admin-section">
      <header>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
function Metric({ icon: Icon, label, value, note }) {
  return (
    <article className="metric-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      <Icon />
    </article>
  );
}
function Select({ label, options, ...props }) {
  return (
    <label className="select-control">
      <span className="sr-only">{label}</span>
      <select aria-label={label} {...props}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      <ListFilter size={15} />
    </label>
  );
}
function Status({ value }) {
  const label = String(value ?? 'unknown').replaceAll('_', ' ');
  return <span className={`status status-${value}`}>{label}</span>;
}
function Field({ label, hint, children }) {
  return (
    <label className="admin-field">
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      {children}
    </label>
  );
}
function EditorSection({ title, children }) {
  return (
    <section className="editor-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function ReviewItem({ ok, title, copy }) {
  return (
    <div className={ok ? 'ok' : 'blocked'}>
      {ok ? <CheckCircle2 /> : <AlertTriangle />}
      <div>
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
    </div>
  );
}
function Notice({ tone = 'neutral', live = false, children }) {
  return (
    <div
      className={`admin-notice ${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={live ? 'polite' : undefined}
    >
      {tone === 'error' ? <AlertTriangle /> : <CheckCircle2 />}
      <span>{children}</span>
    </div>
  );
}
function EmptyState({ title, copy }) {
  return (
    <div className="empty-state">
      <PackageCheck />
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  );
}
function ErrorState({ message, retry }) {
  return (
    <div className="error-state">
      <AlertTriangle />
      <h1>We couldn’t load this view</h1>
      <p>{message}</p>
      <button className="admin-button" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
function AdminLoading() {
  return (
    <div className="admin-loading" role="status" aria-live="polite">
      <LoaderCircle className="spin" />
      <span>Verifying secure session…</span>
    </div>
  );
}
function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-label="Loading">
      <div />
      <div className="skeleton-grid">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="skeleton-panel" />
    </div>
  );
}
function formatDate(value) {
  if (!value) return 'Unknown';
  return new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(value) {
  if (!value) return '—';
  return new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function isExternalResearchRecommendation(product) {
  if ((product.creator ?? '').toLowerCase().includes('gadjit')) return false;
  try {
    const url = new URL(product.source);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      url.hostname !== 'example.com' &&
      !url.hostname.endsWith('.example.com')
    );
  } catch {
    return false;
  }
}

function sourceHostname(source) {
  try {
    return new URL(source).hostname.replace(/^www\./, '');
  } catch {
    return 'External source';
  }
}

function eventCountdown(event) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${event.startDate}T00:00:00`);
  const end = new Date(`${event.endDate}T23:59:59`);
  const daysToStart = Math.ceil((start - today) / 86400000);
  const daysToEnd = Math.ceil((end - today) / 86400000);
  if (daysToEnd < 0) return 'Ended';
  if (daysToStart <= 0) return `${Math.max(daysToEnd, 0)} days left`;
  return `Starts in ${daysToStart} days`;
}

function eventUrgency(event) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${event.startDate}T00:00:00`);
  const days = Math.ceil((start - today) / 86400000);
  if (event.status === 'active' || days <= 14) return 'high';
  if (days <= 45) return 'medium';
  return 'low';
}
