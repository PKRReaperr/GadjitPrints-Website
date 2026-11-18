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

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/collection', label: 'Products' },
  { to: '/process', label: 'How it works' },
  { to: '/studio', label: 'Studio' },
];

const brandLogo = '/brand/gadjitprints-logo.webp';

const processSteps = [
  {
    step: '01',
    title: 'Browse the collection',
    text: 'Find a piece here and open it to see real photos of the finished print and what it is made from.',
  },
  {
    step: '02',
    title: 'Order on Etsy',
    text: 'Follow the link to the Etsy listing to choose any available options, add personalization when a piece offers it, and check out. Etsy handles payment.',
  },
  {
    step: '03',
    title: 'Printed to order',
    text: 'Your piece is printed after the order comes in, then cleaned up and checked before it ships. Small layer lines are part of the process.',
  },
  {
    step: '04',
    title: 'Shipped from Texas',
    text: 'Etsy sends tracking and order updates, and you can message the shop through Etsy with any questions.',
  },
];

const studioFacts = [
  ['01', 'Made to order', 'Each piece is printed after it is ordered, not pulled from a shelf.'],
  ['02', 'Real product photos', 'Every photo shows a finished print from the studio.'],
  ['03', 'Ordered on Etsy', 'Options, personalization, payment, and shipping updates happen on Etsy.'],
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
          <NavLink className="brand" to="/" onClick={() => setOpen(false)}>
            <img src={brandLogo} alt="" width="40" height="40" decoding="async" />
            <span>Gadjit Prints</span>
          </NavLink>
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
                className="icon-button"
                type="button"
                ref={appearanceButtonRef}
                aria-label="Choose appearance"
                aria-haspopup="dialog"
                aria-expanded={appearanceOpen}
                onClick={() => setAppearanceOpen((current) => !current)}
              >
                <AppearanceIcon size={18} aria-hidden="true" />
              </button>
              {appearanceOpen ? (
                <div className="appearance-panel" role="dialog" aria-label="Appearance settings">
                  <p className="label">Appearance</p>
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
                      <Icon size={16} aria-hidden="true" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              className="icon-button menu-toggle"
              type="button"
              ref={menuButtonRef}
              aria-label={open ? 'Close navigation' : 'Open navigation'}
              aria-controls="site-navigation"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
            >
              {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

function Home() {
  return (
    <div className="container page">
      <Hero />
      <AvailableNow />
      <MadeToOrderBand />
      <StudioIntro />
    </div>
  );
}

function Hero() {
  const heroImages = getShowcaseImages(products, 2);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="label label-accent">Made-to-order 3D prints</p>
        <h1 id="hero-title" className="display">
          Finished prints, made one order at a time.
        </h1>
        <p className="lead">
          Practical, giftable, and display-ready pieces, printed in a small Texas studio after you order on Etsy.
        </p>
        <div className="actions">
          <NavLink className="button button-primary" to="/collection">
            Browse products <ArrowRight size={18} aria-hidden="true" />
          </NavLink>
          <ShopLink />
        </div>
      </div>
      {heroImages.length ? (
        <div className={`hero-media hero-media-${heroImages.length}`}>
          {heroImages.map(({ product, imageUrl }) => (
            <NavLink className="hero-tile" key={imageUrl} to={`/collection/${product.slug}`}>
              <span className="photo-frame">
                <img src={imageUrl} alt={product.title} decoding="async" fetchpriority="high" />
              </span>
              <span className="hero-tile-caption">
                <span>{displayName(product.title)}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </span>
            </NavLink>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function AvailableNow() {
  return (
    <section className="section" aria-labelledby="available-title">
      <div className="section-heading section-heading-split">
        <div>
          <p className="label label-accent">Available now</p>
          <h2 id="available-title">Ready to order</h2>
        </div>
        <NavLink className="text-link" to="/collection">
          View all products <ArrowRight size={16} aria-hidden="true" />
        </NavLink>
      </div>
      {products.length ? (
        <>
          <OrderingNote />
          <ProductGrid items={products.slice(0, 4)} />
        </>
      ) : (
        <EmptyCatalog />
      )}
    </section>
  );
}

function MadeToOrderBand() {
  return (
    <section className="section band" aria-labelledby="made-title">
      <div className="band-heading">
        <p className="label label-accent">How ordering works</p>
        <h2 id="made-title">Browse here. Order on Etsy. Printed for you.</h2>
        <NavLink className="button button-light" to="/process">
          See how it works <ArrowRight size={18} aria-hidden="true" />
        </NavLink>
      </div>
      <ol className="band-steps">
        {processSteps.slice(1).map((step, index) => (
          <li key={step.step}>
            <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
            <strong>{step.title}</strong>
            <span>{step.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StudioIntro() {
  const [studioImage] = getShowcaseImages(products, 4).slice(-1);

  return (
    <section className="section split" aria-labelledby="studio-intro-title">
      {studioImage ? (
        <div className="split-media">
          <span className="photo-frame">
            <img src={studioImage.imageUrl} alt={studioImage.product.title} loading="lazy" decoding="async" />
          </span>
        </div>
      ) : null}
      <div className="split-copy">
        <p className="label label-accent">The studio</p>
        <h2 id="studio-intro-title">A small studio for useful, personal pieces.</h2>
        <p>
          Gadjit Prints designs and prints practical and display-worthy pieces to order. Each one is printed on its
          own, cleaned up, and looked over before it leaves the studio. The collection grows as new pieces are listed
          on Etsy.
        </p>
        <NavLink className="text-link" to="/studio">
          About the studio <ArrowRight size={16} aria-hidden="true" />
        </NavLink>
      </div>
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
        label="Products"
        title={'Made-⁠to-⁠order 3D prints'}
        copy="Every piece below is an active listing in the Gadjit Prints Etsy shop. Open a product for photos and details, then choose options and check out on Etsy."
      />
      {products.length ? (
        <section className="catalog" aria-label="Products">
          <div className="catalog-toolbar">
            <div className="filter-chips" role="group" aria-label="Filter by category">
              {categories.map((category) => (
                <button
                  className={`chip${activeCategory === category ? ' is-active' : ''}`}
                  key={category}
                  type="button"
                  aria-pressed={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                  <span className="chip-count">{counts[category] ?? 0}</span>
                </button>
              ))}
            </div>
            <p className="results-count" role="status">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
            </p>
          </div>
          <OrderingNote />
          {filteredProducts.length ? (
            <ProductGrid items={filteredProducts} />
          ) : (
            <div className="empty-state">
              <h2>No products in that category.</h2>
              <p>Show all categories to see everything that is available right now.</p>
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
        label="How it works"
        title="Browse here. Order on Etsy. Printed for you."
        copy="Gadjit Prints shows each piece here with real photos. Ordering, options, personalization, payment, and shipping all happen on Etsy."
      />
      <section className="section" aria-label="Ordering steps">
        <ol className="steps">
          {processSteps.map((step) => (
            <li className="step" key={step.step}>
              <span className="step-number">{step.step}</span>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="section" aria-labelledby="good-to-know-title">
        <div className="section-heading">
          <p className="label label-accent">Good to know</p>
          <h2 id="good-to-know-title">Before you order</h2>
        </div>
        <div className="notes">
          <Note
            title="Options and personalization"
            text="Choices such as size, color, or custom text appear on the Etsy listing whenever a piece offers them."
          />
          <Note
            title="Checkout and shipping"
            text="Etsy handles checkout, payment, shipping, and order updates, so your order lives in your Etsy account."
          />
          <Note
            title="Made after you order"
            text="Pieces are printed after the order arrives, not pulled from a shelf. Allow for the processing time shown on Etsy."
          />
        </div>
      </section>
      <CtaBand />
    </div>
  );
}

function Studio() {
  const studioImages = getShowcaseImages(products, 3);

  return (
    <div className="container page">
      <section className="about-intro" aria-labelledby="studio-title">
        <div className="about-intro-copy">
          <p className="label label-accent">About the studio</p>
          <h1 id="studio-title" className="display display-xl">
            Small studio. Careful prints.
          </h1>
        </div>
        <div className="about-intro-side">
          <p className="lead">
            Gadjit Prints is a small 3D printing studio for practical, personal pieces, made to order and sold through
            Etsy.
          </p>
          <ol className="fact-list">
            {studioFacts.map(([number, title, text]) => (
              <li key={number}>
                <span className="fact-number">{number}</span>
                <div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      {studioImages.length ? (
        <section className={`section photo-row photo-row-${studioImages.length}`} aria-label="Finished pieces">
          {studioImages.map(({ product, imageUrl }) => (
            <figure key={imageUrl}>
              <span className="photo-frame">
                <img src={imageUrl} alt={product.title} loading="lazy" decoding="async" />
              </span>
              <figcaption>{product.title}</figcaption>
            </figure>
          ))}
        </section>
      ) : null}
      <section className="section about-story" aria-labelledby="story-title">
        <h2 id="story-title">Not mass produced</h2>
        <div className="about-story-copy">
          <p>
            The studio exists to make well-made 3D prints easy to find and easy to order, without losing the attention
            that makes a made-to-order piece worthwhile.
          </p>
          <p>
            Every piece is printed after it is ordered, then cleaned up and checked before it ships from Texas. That
            can take a little longer than a mass-production shop, but each piece gets real attention.
          </p>
          <p className="supporting-note">
            Gadjit Prints is a sister studio to{' '}
            <a href="https://gadjit.net" target="_blank" rel="noreferrer">
              Gadjit
            </a>
            , based in the Houston area.
          </p>
        </div>
      </section>
      <CtaBand />
    </div>
  );
}

function PageIntro({ label, title, copy }) {
  return (
    <section className="page-intro">
      <p className="label label-accent">{label}</p>
      <h1 className="display">{title}</h1>
      <p className="lead">{copy}</p>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="section band band-cta" aria-labelledby="cta-title">
      <h2 id="cta-title">Find a piece to order</h2>
      <div className="actions">
        <NavLink className="button button-light" to="/collection">
          Browse products <ArrowRight size={18} aria-hidden="true" />
        </NavLink>
        <ShopLink className="text-link text-link-light" />
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

function OrderingNote() {
  return (
    <p className="ordering-note">
      <span className="marker" aria-hidden="true" />
      Each piece is printed after you order. Options, personalization, and checkout happen on Etsy.
    </p>
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
      <NavLink className="product-card-media" to={detailUrl} tabIndex={-1} aria-hidden="true">
        <span className="photo-frame">
          <ProductMedia product={product} imageIndex={0} decorative />
        </span>
      </NavLink>
      <div className="product-card-body">
        <p className="label">{product.category}</p>
        <h3 className="product-card-title">
          <NavLink to={detailUrl}>{displayName(product.title)}</NavLink>
        </h3>
        <p className={`product-card-type${product.type ? '' : ' is-summary'}`}>{product.type ?? product.copy}</p>
        {optionsLabel ? <p className="product-card-options">{optionsLabel}</p> : null}
        <div className="product-card-actions">
          <EtsyLink product={product} className="button button-secondary button-small" />
          <NavLink className="text-link" to={detailUrl} aria-label={`Details: ${product.title}`}>
            Details
          </NavLink>
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

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product.slug]);

  return (
    <div className="container page product-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <NavLink to="/collection">Products</NavLink>
        <ChevronRight size={14} aria-hidden="true" />
        <span>{product.category}</span>
        <ChevronRight size={14} aria-hidden="true" />
        <span aria-current="page">{product.title}</span>
      </nav>
      <div className="product-layout">
        <section className="gallery" aria-label={`${product.title} photos`}>
          <div className="gallery-frame photo-frame">
            <ProductMedia product={product} imageIndex={selectedImageIndex} />
            {imageCount > 1 ? (
              <div className="gallery-controls">
                <button className="icon-button" type="button" onClick={showPrevious} aria-label="Previous photo">
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <span className="gallery-count" aria-live="polite">
                  {selectedImageIndex + 1} / {imageCount}
                </span>
                <button className="icon-button" type="button" onClick={showNext} aria-label="Next photo">
                  <ChevronRight size={20} aria-hidden="true" />
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
          <p className="label label-accent">{product.category}</p>
          <h1 id="product-title" className="product-title">
            {displayName(product.title)}
          </h1>
          {product.type ? <p className="product-type">{product.type}</p> : null}
          <div className="product-cta">
            {needsEtsyCustomization(product) ? (
              <p className="product-options-note">{getEtsyOptionsNote(product)}</p>
            ) : null}
            <EtsyLink product={product} className="button button-primary button-block" />
            <p className="fine-print">Price on Etsy. Made to order and shipped from Texas.</p>
          </div>
          <div className="product-description">
            <p>{product.copy}</p>
          </div>
          {product.includes?.length ? (
            <ul className="detail-list" aria-label="Details">
              {product.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          <ul className="detail-list detail-list-muted" aria-label="Ordering">
            <li>Printed after you check out on Etsy</li>
            <li>Payment, shipping, and order updates through Etsy</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function ProductMedia({ product, imageIndex = 0, decorative = false }) {
  const imageUrl = product.imageUrls?.[imageIndex] ?? product.imageUrls?.[0];

  if (!imageUrl) {
    return <span className="photo-missing" role="img" aria-label={`${product.title} photo coming soon`} />;
  }

  return (
    <img
      src={imageUrl}
      alt={decorative ? '' : `${product.title}, photo ${imageIndex + 1}`}
      loading="lazy"
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
      {label} <ArrowUpRight size={16} aria-hidden="true" />
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
      {label} <ArrowUpRight size={16} aria-hidden="true" />
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
        <div className="footer-brand">
          <img src={brandLogo} alt="" width="40" height="40" loading="lazy" decoding="async" />
          <div>
            <strong>Gadjit Prints</strong>
            <p>Custom 3D printed pieces, made to order and sold on Etsy.</p>
          </div>
        </div>
        <nav className="footer-nav" aria-label="Footer">
          <p className="label">Explore</p>
          {navItems.slice(1).map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="footer-shop">
          <p className="label">Order</p>
          <ShopLink className="footer-shop-link" />
        </div>
        <p className="footer-notice">
          The term 'Etsy' is a trademark of Etsy, Inc. This Application uses Etsy's API, but is not endorsed or
          certified by Etsy.
        </p>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
