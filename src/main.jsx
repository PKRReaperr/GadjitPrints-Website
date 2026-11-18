import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigate, NavLink, Route, BrowserRouter as Router, Routes, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Menu, Monitor, Moon, Sun, X } from 'lucide-react';
import './styles.css';
import {
  etsyShopUrl,
  getEtsyActionLabel,
  getEtsyListingUrl,
  getEtsyOptionsNote,
  getShowcaseImages,
  needsEtsyCustomization,
  products,
} from './data/catalog.js';

// The brand mark links home, so the navigation lists only the inner pages.
const navItems = [
  { to: '/collection', label: 'Products' },
  { to: '/process', label: 'How it works' },
  { to: '/studio', label: 'Studio' },
];

// Black mark on a transparent background; CSS inverts it in dark mode.
const brandLogo = '/brand/gadjitprints-mark.webp';

// The listing whose first photo leads the homepage. Falls back to the first listing
// if this one is ever removed from the shop.
const featuredSlug = 'soccer-trophy-cup';

const processSteps = [
  {
    step: '01',
    title: 'Choose a piece',
    text: 'Browse the collection and open a piece to see photos of the finished print.',
  },
  {
    step: '02',
    title: 'Order on Etsy',
    text: 'The Etsy listing is where you choose options, add personalization when a piece offers it, and check out.',
  },
  {
    step: '03',
    title: 'Printed to order',
    text: 'Your piece is printed after the order arrives, then cleaned up and checked. Fine layer lines are part of the process.',
  },
  {
    step: '04',
    title: 'Shipped to you',
    text: 'Etsy sends tracking and order updates. Message the shop through Etsy with any questions.',
  },
];

const makingSteps = [
  ['Printed after you order', 'Nothing is printed ahead and stored. Each piece starts once its order comes in.'],
  ['Cleaned up and checked', 'Every print is cleaned up and looked over before it is packed.'],
  ['Material named on each piece', 'Each product page lists what the piece is printed in, so you know what arrives.'],
];

function App() {
  return (
    <Router>
      <ScrollToTop />
      <SiteShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/collection/:slug/configure" element={<LegacyConfigureRedirect />} />
          <Route path="/collection/:slug" element={<ProductDetail />} />
          <Route path="/process" element={<Process />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/quote" element={<Navigate to="/collection" replace />} />
          <Route path="*" element={<Navigate to="/collection" replace />} />
        </Routes>
      </SiteShell>
    </Router>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}

function SiteShell({ children }) {
  const [open, setOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [preference, setPreference] = useState(() => window.gadjitAppearance?.getPreference?.() ?? 'system');
  const menuButtonRef = useRef(null);
  const appearanceButtonRef = useRef(null);
  const appearancePanelRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const syncAppearance = () => setPreference(window.gadjitAppearance?.getPreference?.() ?? 'system');
    window.addEventListener('appearancechange', syncAppearance);
    return () => window.removeEventListener('appearancechange', syncAppearance);
  }, []);

  useEffect(() => {
    setOpen(false);
    setAppearanceOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (appearanceOpen) {
          setAppearanceOpen(false);
          appearanceButtonRef.current?.focus();
        } else if (open) {
          setOpen(false);
          menuButtonRef.current?.focus();
        }
      }
    };
    const onPointerDown = (event) => {
      if (appearanceOpen && appearancePanelRef.current && !appearancePanelRef.current.contains(event.target)) {
        setAppearanceOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [appearanceOpen, open]);

  function chooseAppearance(value) {
    window.gadjitAppearance?.setPreference?.(value);
    setPreference(value);
  }

  const AppearanceIcon = preference === 'light' ? Sun : preference === 'dark' ? Moon : Monitor;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={`site-header${open ? ' is-open' : ''}`}>
        <div className="container header-inner">
          <Brand className="brand" onClick={() => setOpen(false)} />
          <nav className="nav" id="site-navigation" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <div className="appearance-control" ref={appearancePanelRef}>
              <button
                className="icon-button icon-button-quiet"
                type="button"
                ref={appearanceButtonRef}
                aria-label="Choose appearance"
                aria-haspopup="dialog"
                aria-expanded={appearanceOpen}
                onClick={() => setAppearanceOpen((current) => !current)}
              >
                <AppearanceIcon size={17} strokeWidth={1.75} aria-hidden="true" />
              </button>
              {appearanceOpen ? (
                <div className="appearance-panel" role="dialog" aria-label="Appearance settings">
                  <p className="panel-title">Appearance</p>
                  {[
                    ['system', 'System', Monitor],
                    ['light', 'Light', Sun],
                    ['dark', 'Dark', Moon],
                  ].map(([value, label, Icon]) => (
                    <label className="appearance-option" key={value}>
                      <input
                        type="radio"
                        name="appearance"
                        value={value}
                        checked={preference === value}
                        onChange={() => chooseAppearance(value)}
                      />
                      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              className="icon-button icon-button-quiet menu-toggle"
              type="button"
              ref={menuButtonRef}
              aria-label={open ? 'Close navigation' : 'Open navigation'}
              aria-controls="site-navigation"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
            >
              {open ? <X size={20} strokeWidth={1.75} aria-hidden="true" /> : <Menu size={20} strokeWidth={1.75} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

function Brand({ className, onClick, lazy = false }) {
  return (
    <NavLink className={className} to="/" onClick={onClick} aria-label="Gadjit Prints, home">
      <img
        src={brandLogo}
        alt=""
        width="36"
        height="36"
        decoding="async"
        loading={lazy ? 'lazy' : undefined}
      />
      <span className="wordmark" aria-hidden="true">
        Gadjit Prints
      </span>
    </NavLink>
  );
}

function Home() {
  return (
    <div className="container page">
      <HomeIntro />
      <FeaturedPiece />
      <HomeCollection />
      <HomeOrdering />
      <StudioNote />
    </div>
  );
}

function HomeIntro() {
  return (
    <section className="intro intro-home" aria-labelledby="home-title">
      <h1 id="home-title" className="display">
        <span className="line">Finished prints,</span> <span className="line">made one order at a time.</span>
      </h1>
      <p className="lead">Useful, giftable pieces from a small 3D printing studio, printed after you order on Etsy.</p>
      <NavLink className="button button-primary" to="/collection">
        Browse products
      </NavLink>
    </section>
  );
}

function FeaturedPiece() {
  const product = products.find((item) => item.slug === featuredSlug) ?? products[0];
  const imageUrl = product?.imageUrls?.[0];

  if (!imageUrl) {
    return null;
  }

  return (
    <section className="featured" aria-label="Featured piece">
      <NavLink className="featured-link" to={`/collection/${product.slug}`}>
        <span className="featured-mat">
          <img src={imageUrl} alt={product.title} decoding="async" fetchpriority="high" />
        </span>
        <span className="featured-caption">
          <span className="featured-name">{displayName(product.title)}</span>
          <span className="featured-cue">
            View the piece <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </span>
        </span>
      </NavLink>
    </section>
  );
}

function HomeCollection() {
  const shown = products.slice(0, 3);

  return (
    <section className="section" aria-labelledby="collection-title">
      <div className="section-heading">
        <h2 id="collection-title">The collection</h2>
        {products.length > shown.length ? (
          <NavLink className="text-link" to="/collection">
            View all {products.length}
          </NavLink>
        ) : null}
      </div>
      {shown.length ? <ProductGrid items={shown} /> : <EmptyCatalog />}
    </section>
  );
}

function HomeOrdering() {
  return (
    <section className="section ordering" aria-labelledby="ordering-title">
      <div className="section-heading">
        <h2 id="ordering-title">How ordering works</h2>
        <NavLink className="text-link" to="/process">
          The details
        </NavLink>
      </div>
      <ol className="step-columns">
        {processSteps.slice(1).map((step, index) => (
          <li key={step.step}>
            <span className="numeral" aria-hidden="true">
              {index + 1}
            </span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StudioNote() {
  return (
    <section className="section studio-note" aria-labelledby="studio-note-title">
      <h2 id="studio-note-title">A small studio for useful, personal pieces.</h2>
      <p>
        Each piece is printed on its own, cleaned up, and looked over before it ships. The collection grows as new
        pieces are listed.
      </p>
      <NavLink className="text-link" to="/studio">
        About the studio
      </NavLink>
    </section>
  );
}

function Collection() {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', ...new Set(products.map((product) => product.category))];
  const counts = getCategoryCounts(products);
  const filteredProducts = products.filter(
    (product) => activeCategory === 'All' || product.category === activeCategory
  );

  return (
    <div className="container page">
      <PageIntro
        title="The collection"
        copy="Every piece is a current listing in the Gadjit Prints Etsy shop, printed after you order."
      />
      {products.length ? (
        <section className="catalog" aria-label="Products">
          {categories.length > 2 ? (
            <div className="catalog-toolbar">
              <div className="filters" role="group" aria-label="Filter by category">
                {categories.map((category) => (
                  <button
                    className={`filter${activeCategory === category ? ' is-active' : ''}`}
                    key={category}
                    type="button"
                    aria-pressed={activeCategory === category}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                    <span className="filter-count">{counts[category] ?? 0}</span>
                  </button>
                ))}
              </div>
              <p className="results-count" role="status">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
              </p>
            </div>
          ) : null}
          {filteredProducts.length ? (
            <ProductGrid items={filteredProducts} />
          ) : (
            <div className="empty-state">
              <h2>No pieces in that category.</h2>
              <p>Show every category to see what is available right now.</p>
              <button className="button button-secondary" type="button" onClick={() => setActiveCategory('All')}>
                Show all
              </button>
            </div>
          )}
        </section>
      ) : (
        <EmptyCatalog />
      )}
    </div>
  );
}

function Process() {
  return (
    <div className="container page">
      <PageIntro
        title="How ordering works"
        copy="You browse here and order on Etsy. Options, personalization, payment, and shipping updates all happen there."
      />
      <section className="section section-tight" aria-label="Ordering steps">
        <ol className="steps">
          {processSteps.map((step, index) => (
            <li className="step" key={step.step}>
              <span className="numeral" aria-hidden="true">
                {index + 1}
              </span>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="section" aria-labelledby="before-title">
        <div className="section-heading">
          <h2 id="before-title">Before you order</h2>
        </div>
        <div className="notes">
          <Note
            title="Options and personalization"
            text="Choices such as size, color, or custom text appear on the Etsy listing when a piece offers them."
          />
          <Note
            title="Checkout and shipping"
            text="Etsy handles payment, shipping, and order updates, so your order lives in your Etsy account."
          />
          <Note
            title="Processing time"
            text="Pieces are printed after the order arrives. Etsy shows the processing time for each listing."
          />
        </div>
      </section>
      <ClosingCta />
    </div>
  );
}

function Studio() {
  const studioImages = getShowcaseImages(products, 3);

  return (
    <div className="container page">
      <PageIntro
        title="Small studio. Careful prints."
        copy="Gadjit Prints makes practical and display pieces in small numbers, each printed to order and sold through Etsy."
      />
      {studioImages.length ? (
        <section className={`section section-tight gallery-row gallery-row-${studioImages.length}`} aria-label="Finished pieces">
          {studioImages.map(({ product, imageUrl }) => (
            <figure key={imageUrl}>
              <NavLink className="mat-frame" to={`/collection/${product.slug}`} aria-label={product.title}>
                <img src={imageUrl} alt="" loading="lazy" decoding="async" />
              </NavLink>
              <figcaption>{displayName(product.title)}</figcaption>
            </figure>
          ))}
        </section>
      ) : null}
      <section className="section" aria-labelledby="making-title">
        <div className="section-heading">
          <h2 id="making-title">How each piece is made</h2>
        </div>
        <ol className="step-columns">
          {makingSteps.map(([title, text], index) => (
            <li key={title}>
              <span className="numeral" aria-hidden="true">
                {index + 1}
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="section studio-note" aria-label="About Gadjit Prints">
        <p>
          The collection grows as new pieces are listed on Etsy. Gadjit Prints is a sister studio to{' '}
          <a href="https://gadjit.net" target="_blank" rel="noreferrer">
            Gadjit
          </a>
          .
        </p>
      </section>
      <ClosingCta />
    </div>
  );
}

function PageIntro({ title, copy }) {
  return (
    <section className="intro">
      <h1 className="display">{title}</h1>
      {copy ? <p className="lead">{copy}</p> : null}
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="section closing" aria-labelledby="closing-title">
      <h2 id="closing-title">Find a piece to order</h2>
      <div className="actions">
        <NavLink className="button button-primary" to="/collection">
          Browse products
        </NavLink>
        <ShopLink />
      </div>
    </section>
  );
}

function Note({ title, text }) {
  return (
    <article className="note">
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function EmptyCatalog() {
  return (
    <div className="empty-state">
      <h2>New pieces are on the way.</h2>
      <p>Nothing is listed right now. Check the Etsy shop for the latest pieces.</p>
      <ShopLink className="button button-secondary" />
    </div>
  );
}

function ProductGrid({ items }) {
  return (
    <ul className="product-grid">
      {items.map((product) => (
        <li key={product.slug}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ product }) {
  const detailUrl = `/collection/${product.slug}`;
  const optionsLabel = getCardOptionsLabel(product);

  return (
    <article className="product-card">
      <NavLink className="mat-frame product-card-media" to={detailUrl} tabIndex={-1} aria-hidden="true">
        <ProductMedia product={product} imageIndex={0} decorative />
      </NavLink>
      <div className="product-card-body">
        <h3 className="product-card-title">
          <NavLink to={detailUrl}>{displayName(product.title)}</NavLink>
        </h3>
        <p className={`product-card-type${product.type ? '' : ' is-summary'}`}>{product.type ?? product.copy}</p>
        {optionsLabel ? <p className="product-card-options">{optionsLabel}</p> : null}
        <div className="product-card-actions">
          <NavLink className="text-link" to={detailUrl} aria-label={`View details: ${product.title}`}>
            View details
          </NavLink>
          <EtsyLink product={product} className="quiet-link" />
        </div>
      </div>
    </article>
  );
}

// Keep number ranges such as "200–500mm" on one line so long product names wrap between words.
function displayName(title) {
  return title.replace(/(\d)([–-])(?=\d)/g, '$1$2⁠');
}

function getCardOptionsLabel(product) {
  const etsy = product.etsy ?? {};
  if (etsy.personalization === 'required') return 'Personalized on Etsy';
  if (etsy.personalization === 'optional') return 'Optional personalization on Etsy';
  if (etsy.hasOptions) return 'Options chosen on Etsy';
  return null;
}

function ProductDetail() {
  const { slug } = useParams();
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    return <Navigate to="/collection" replace />;
  }

  return <ProductDetailContent product={product} />;
}

// Old configurator links (/collection/:slug/configure) now land on the product page,
// which in turn falls back to /collection for products that are no longer listed.
function LegacyConfigureRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/collection/${slug}`} replace />;
}

function ProductDetailContent({ product }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const imageCount = product.imageUrls?.length ?? 0;
  const showPrevious = () => setSelectedImageIndex((index) => (index === 0 ? imageCount - 1 : index - 1));
  const showNext = () => setSelectedImageIndex((index) => (index === imageCount - 1 ? 0 : index + 1));
  const closerLook = imageCount >= 3 ? product.imageUrls.slice(1, 4) : [];

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product.slug]);

  return (
    <div className="container page product-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <NavLink to="/collection">Products</NavLink>
        <ChevronRight size={13} strokeWidth={1.75} aria-hidden="true" />
        <span>{product.category}</span>
      </nav>
      <div className="product-layout">
        <section className="gallery" aria-label={`${product.title} photos`}>
          <div className={`gallery-frame mat-frame${imageCount > 1 ? ' has-controls' : ''}`}>
            <ProductMedia product={product} imageIndex={selectedImageIndex} eager />
            {imageCount > 1 ? (
              <div className="gallery-controls">
                <button className="gallery-button" type="button" onClick={showPrevious} aria-label="Previous photo">
                  <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
                </button>
                <span className="gallery-count" aria-live="polite">
                  {selectedImageIndex + 1} / {imageCount}
                </span>
                <button className="gallery-button" type="button" onClick={showNext} aria-label="Next photo">
                  <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>
          {imageCount > 1 ? (
            <div className="thumbs">
              {product.imageUrls.map((imageUrl, index) => (
                <button
                  className={`thumb${selectedImageIndex === index ? ' is-active' : ''}`}
                  key={imageUrl}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`View photo ${index + 1} of ${imageCount}`}
                  aria-pressed={selectedImageIndex === index}
                >
                  <img src={imageUrl} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          ) : null}
        </section>
        <section className="product-info" aria-labelledby="product-title">
          <div className="product-summary">
            <h1 id="product-title" className="product-title">
              {displayName(product.title)}
            </h1>
            {product.type ? <p className="product-type">{product.type}</p> : null}
            {product.includes?.length ? (
              <ul className="essentials" aria-label="Details">
                {product.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="product-cta">
            {needsEtsyCustomization(product) ? (
              <p className="product-options-note">{getEtsyOptionsNote(product)}</p>
            ) : null}
            <EtsyLink product={product} className="button button-primary button-block" />
            <p className="fine-print">Price and checkout on Etsy.</p>
          </div>
          <div className="product-description">
            <p>{product.copy}</p>
          </div>
        </section>
      </div>
      {closerLook.length ? (
        <section className={`section closer-look closer-look-${closerLook.length}`} aria-labelledby="closer-title">
          <div className="section-heading">
            <h2 id="closer-title">A closer look</h2>
          </div>
          <div className="closer-look-grid">
            {closerLook.map((imageUrl, index) => (
              <span className="mat-frame" key={imageUrl}>
                <img src={imageUrl} alt={`${product.title}, detail photo ${index + 1}`} loading="lazy" decoding="async" />
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ProductMedia({ product, imageIndex = 0, decorative = false, eager = false }) {
  const imageUrl = product.imageUrls?.[imageIndex] ?? product.imageUrls?.[0];

  if (!imageUrl) {
    return <span className="photo-missing" role="img" aria-label={`${product.title} photo coming soon`} />;
  }

  return (
    <img
      src={imageUrl}
      alt={decorative ? '' : `${product.title}, photo ${imageIndex + 1}`}
      loading={eager ? undefined : 'lazy'}
      decoding="async"
    />
  );
}

function EtsyLink({ product, className = 'button button-primary' }) {
  const label = getEtsyActionLabel(product);

  // rel leaves out "noreferrer" on purpose so Etsy shop stats can credit the website as the traffic source.
  return (
    <a
      className={className}
      href={getEtsyListingUrl(product)}
      target="_blank"
      rel="noopener"
      aria-label={`${label}: ${product.title} (opens Etsy in a new tab)`}
    >
      {label} <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
    </a>
  );
}

function ShopLink({ className = 'text-link', label = 'Visit the Etsy shop' }) {
  return (
    <a
      className={className}
      href={etsyShopUrl}
      target="_blank"
      rel="noopener"
      aria-label={`${label} (opens Etsy in a new tab)`}
    >
      {label} <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
    </a>
  );
}

function getCategoryCounts(items) {
  return items.reduce(
    (counts, product) => ({
      ...counts,
      [product.category]: (counts[product.category] ?? 0) + 1,
    }),
    { All: items.length }
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Brand className="brand footer-brand" lazy />
        <nav className="footer-nav" aria-label="Footer">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
          <ShopLink className="footer-shop-link" label="Etsy shop" />
        </nav>
        <p className="footer-notice">
          The term 'Etsy' is a trademark of Etsy, Inc. This Application uses Etsy's API, but is not endorsed or
          certified by Etsy.
        </p>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
