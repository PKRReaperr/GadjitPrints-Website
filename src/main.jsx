import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigate, NavLink, Route, BrowserRouter as Router, Routes, useLocation, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageCircle,
  Monitor,
  Moon,
  Package,
  ShoppingBag,
  SlidersHorizontal,
  Sun,
  Truck,
  X,
} from 'lucide-react';
import './styles.css';
import {
  etsyShopUrl,
  getEtsyActionLabel,
  getEtsyListingUrl,
  getEtsyOptionsNote,
  getShowcaseImages,
  products,
} from './data/catalog.js';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/collection', label: 'Products' },
  { to: '/process', label: 'How it works' },
  { to: '/studio', label: 'Studio' },
];

const brandLogo = '/brand/gadjitprints-logo.webp';

const ribbonItems = [
  'Made to order',
  'Real product photos',
  'Ordered on Etsy',
  'Printed one order at a time',
  'Ships from Texas',
  'Small studio',
];

const processSteps = [
  {
    step: '01',
    title: 'Find a piece',
    text: 'Browse the collection here and open a product to see real photos of the finished print and what it is made from.',
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <>
      <header className="site-header">
        <NavLink className="brand" to="/" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            <img src={brandLogo} alt="" width="46" height="46" decoding="async" />
          </span>
          <span>
            <strong>Gadjit Prints</strong>
            <small>Custom 3D printed goods</small>
          </span>
        </NavLink>
        <nav className={`nav ${open ? 'is-open' : ''}`} id="site-navigation" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <NavLink className="header-cta" to="/collection">
          Browse products <ArrowRight size={16} />
        </NavLink>
        <div className="appearance-control" ref={appearancePanelRef}>
          <button
            className="appearance-toggle"
            type="button"
            ref={appearanceButtonRef}
            aria-label="Choose appearance"
            aria-haspopup="dialog"
            aria-expanded={appearanceOpen}
            onClick={() => setAppearanceOpen((current) => !current)}
          >
            {preference === 'light' ? <Sun size={18} /> : preference === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
            <span className="appearance-toggle-label">Appearance</span>
          </button>
          {appearanceOpen ? (
            <div className="appearance-panel" role="dialog" aria-label="Appearance settings">
              <strong>Appearance</strong>
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
          className="menu-toggle"
          type="button"
          ref={menuButtonRef}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-controls="site-navigation"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
      <main>{children}</main>
      <Footer />
    </>
  );
}

function Home() {
  return (
    <>
      <Hero />
      <FeaturedWork />
      <CategoryRibbon />
      <ProcessPreview />
      <StudioCallout />
    </>
  );
}

function Hero() {
  const heroImages = getShowcaseImages(products, 3);

  return (
    <section className="hero">
      <div className="hero-media" />
      <div className="hero-veil" />
      <div className="hero-content reveal">
        <p className="eyebrow">Custom 3D prints, made to order</p>
        <h1>Finished 3D prints, made one order at a time.</h1>
        <p className="hero-copy">
          Gadjit Prints makes practical, giftable, and display-ready pieces in a small Texas studio. Browse the
          collection here, then order on Etsy. Each piece is printed after you check out.
        </p>
        <div className="hero-actions">
          <NavLink className="button button-primary" to="/collection">
            Browse products <ArrowRight size={18} />
          </NavLink>
          <ShopLink className="button button-ghost" />
        </div>
      </div>
      <div className="hero-objects" aria-hidden="true">
        {heroImages.map(({ imageUrl }) => (
          <img className="product-photo" key={imageUrl} src={imageUrl} alt="" decoding="async" />
        ))}
      </div>
      <div className="hero-specimen float-card">
        <span>Made to order</span>
        <strong>Printed after you order on Etsy, then checked and shipped from Texas</strong>
      </div>
    </section>
  );
}

function FeaturedWork() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!products.length) {
    return null;
  }

  const selectedProduct = products[selectedIndex] ?? products[0];
  const previousProduct = () => setSelectedIndex((index) => (index === 0 ? products.length - 1 : index - 1));
  const nextProduct = () => setSelectedIndex((index) => (index === products.length - 1 ? 0 : index + 1));

  return (
    <section className="section">
      <SectionIntro
        label="Available now"
        title="Pieces you can order today."
        copy="Every piece here is an active listing in the Gadjit Prints Etsy shop. Open one for more photos and details, then order it on Etsy."
      />
      <div className="product-carousel reveal">
        <div className="carousel-stage" key={selectedProduct.slug}>
          <NavLink className="carousel-media" to={`/collection/${selectedProduct.slug}`}>
            <ProductMedia product={selectedProduct} imageIndex={0} />
          </NavLink>
          <div className="carousel-copy">
            <span>{selectedProduct.type ?? selectedProduct.category}</span>
            <h3>{selectedProduct.title}</h3>
            <p>{selectedProduct.copy}</p>
            <div className="carousel-meta">
              <small>{selectedProduct.category}</small>
              <small>Made to order</small>
              <small>Ordered on Etsy</small>
            </div>
            <NavLink className="text-link" to={`/collection/${selectedProduct.slug}`}>
              View product <ArrowRight size={17} />
            </NavLink>
          </div>
        </div>
        {products.length > 1 ? (
          <div className="carousel-controls">
            <button type="button" onClick={previousProduct} aria-label="Previous product">
              <ChevronLeft size={18} />
            </button>
            <div className="carousel-menu" role="tablist" aria-label="Homepage product carousel">
              {products.map((product, index) => (
                <button
                  className={selectedIndex === index ? 'is-active' : ''}
                  key={product.slug}
                  type="button"
                  role="tab"
                  aria-selected={selectedIndex === index}
                  onClick={() => setSelectedIndex(index)}
                >
                  <span>{product.title}</span>
                  <small>{product.type ?? product.category}</small>
                </button>
              ))}
            </div>
            <button type="button" onClick={nextProduct} aria-label="Next product">
              <ChevronRight size={18} />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CategoryRibbon() {
  return (
    <section className="ribbon">
      <div className="ribbon-track">
        {[...ribbonItems, ...ribbonItems].map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function ProcessPreview() {
  return (
    <section className="section split-section">
      <div className="split-copy reveal">
        <p className="eyebrow">How ordering works</p>
        <h2>Browse here. Order on Etsy. Printed for you.</h2>
        <p>
          Find a piece in the collection, then order it through the Gadjit Prints Etsy shop. It is printed after your
          order arrives and checked before it ships.
        </p>
        <NavLink className="text-link" to="/process">
          See how it works <ArrowRight size={17} />
        </NavLink>
      </div>
      <div className="process-stack">
        {processSteps.slice(0, 3).map((step) => (
          <article className="process-card reveal" key={step.step}>
            <span>{step.step}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StudioCallout() {
  const wallImages = getShowcaseImages(products, 3);

  return (
    <section className="studio-callout">
      <div className="object-wall" aria-hidden="true">
        {wallImages.map(({ imageUrl }) => (
          <img className="product-photo" key={imageUrl} src={imageUrl} alt="" loading="lazy" decoding="async" />
        ))}
      </div>
      <div className="studio-panel reveal">
        <p className="eyebrow">Small studio, careful output</p>
        <h2>Printed after you order, checked before it ships.</h2>
        <p>
          The collection grows as new pieces are listed on Etsy. Each order is printed on its own, cleaned up, and
          looked over before it leaves the studio.
        </p>
        <NavLink className="button button-primary" to="/studio">
          About the studio <ArrowRight size={18} />
        </NavLink>
      </div>
    </section>
  );
}

function Collection() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categories = ['All', ...new Set(products.map((product) => product.category))];
  const filteredProducts = products.filter(
    (product) => activeCategory === 'All' || product.category === activeCategory
  );
  const activeFilterCount = activeCategory === 'All' ? 0 : 1;
  const clearFilters = () => setActiveCategory('All');

  return (
    <PageFrame
      label="Products"
      title="Made-to-order 3D prints, available on Etsy."
      copy="Every piece below is an active listing in the Gadjit Prints Etsy shop. Open a product for photos and details, then choose options and check out on Etsy."
    >
      {products.length ? (
        <div className="catalog-shell">
          <div className="catalog-toolbar">
            <button
              className="filters-toggle"
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="catalog-filters"
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <SlidersHorizontal size={18} />
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </button>
            <span className="results-count" role="status">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
            </span>
            {activeFilterCount ? (
              <button className="clear-filters" type="button" onClick={clearFilters}>
                Clear
              </button>
            ) : null}
          </div>
          <aside className={`catalog-filters ${filtersOpen ? 'is-open' : ''}`} id="catalog-filters">
            <div className="filter-heading">
              <span>
                <SlidersHorizontal size={18} />
                Filters
              </span>
              <button type="button" onClick={clearFilters}>
                Clear
              </button>
            </div>
            <FilterGroup
              icon={<Package size={18} />}
              title="Category"
              options={categories}
              active={activeCategory}
              counts={getCategoryCounts(products)}
              onSelect={setActiveCategory}
            />
          </aside>
          {filteredProducts.length ? (
            <div className="product-card-grid">
              {filteredProducts.map((item) => (
                <ProductCard product={item} key={item.slug} />
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <h2>No products in that category.</h2>
              <p>Clear the filter to see everything that is available right now.</p>
              <button className="button button-ghost" type="button" onClick={clearFilters}>
                Clear filter
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-results">
          <h2>New pieces are on the way.</h2>
          <p>Nothing is listed right now. Check the Etsy shop for the latest pieces.</p>
          <ShopLink className="button button-ghost" />
        </div>
      )}
    </PageFrame>
  );
}

function Process() {
  return (
    <PageFrame
      label="How it works"
      title="Browse here. Order on Etsy. Printed for you."
      copy="Gadjit Prints shows each piece here with real photos. Ordering, options, personalization, payment, and shipping all happen on Etsy."
    >
      <div className="timeline">
        {processSteps.map((step) => (
          <article className="timeline-item reveal" key={step.step}>
            <span>{step.step}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="note-grid">
        <Note
          icon={<Check />}
          title="Options and personalization"
          text="Choices such as size, color, or custom text appear on the Etsy listing whenever a piece offers them."
        />
        <Note
          icon={<ShoppingBag />}
          title="Checkout and shipping"
          text="Etsy handles checkout, payment, shipping, and order updates, so your order lives in your Etsy account."
        />
        <Note
          icon={<MessageCircle />}
          title="Made after you order"
          text="Pieces are printed after the order arrives, not pulled from a shelf. Allow for the processing time shown on Etsy."
        />
      </div>
    </PageFrame>
  );
}

function Studio() {
  const studioImages = getShowcaseImages(products, 3);

  return (
    <PageFrame
      label="About the studio"
      title="A small 3D printing studio for practical, personal pieces."
      copy="Gadjit Prints designs and prints useful and display-worthy pieces to order, and sells them through Etsy."
    >
      <section className="about-layout">
        <div className="about-image reveal" aria-hidden="true">
          {studioImages.map(({ imageUrl }) => (
            <img className="product-photo" key={imageUrl} src={imageUrl} alt="" loading="lazy" decoding="async" />
          ))}
        </div>
        <div className="about-copy reveal">
          <h2>Not mass produced. Printed, checked, and shipped one order at a time.</h2>
          <p>
            The studio exists to make well-made 3D prints easy to find and easy to order, without losing the attention
            that makes a made-to-order piece worthwhile.
          </p>
          <p>
            As a small Houston-area project, Gadjit Prints also has a quiet connection to{' '}
            <a className="text-link" href="https://gadjit.net" target="_blank" rel="noreferrer">
              Gadjit
            </a>
            , a camera business with more than 10 years of experience around used and open-box camera gear.
          </p>
          <p>
            Every piece is printed after it is ordered, then cleaned up and checked before it ships. That can take a
            little longer than a mass-production shop, but each piece gets real attention.
          </p>
          <div className="value-list">
            <span>Made to order</span>
            <span>Real product photos</span>
            <span>Ordered on Etsy</span>
            <span>Ships from Texas</span>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function PageFrame({ label, title, copy, children }) {
  return (
    <section className="page-frame">
      <div className="page-heading reveal">
        <p className="eyebrow">{label}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {children}
    </section>
  );
}

function SectionIntro({ label, title, copy }) {
  return (
    <div className="section-intro reveal">
      <p className="eyebrow">{label}</p>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function Note({ icon, title, text }) {
  return (
    <article className="note reveal">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function ProductCard({ product }) {
  return (
    <article className="catalog-card reveal">
      <NavLink className="catalog-card-link" to={`/collection/${product.slug}`} aria-label={`View ${product.title}`} />
      <div className="catalog-card-title">
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
        <h3>{product.title}</h3>
      </div>
      <div className="catalog-media">
        <ProductMedia product={product} imageIndex={0} />
      </div>
      <div className="catalog-specs">
        <div>
          <strong>Type</strong>
          <span>{product.type ?? product.category}</span>
        </div>
        <div>
          <strong>Options</strong>
          <span>Chosen on Etsy</span>
        </div>
      </div>
      <p className={`catalog-etsy-note${product.includes?.length ? '' : ' fills-row'}`}>
        {getEtsyOptionsNote(product)}
      </p>
      {product.includes?.length ? (
        <div className="catalog-tags">
          {product.includes.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}
      <EtsyLink className="configure-button etsy-button" product={product} />
    </article>
  );
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

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product.slug]);

  return (
    <section className="product-detail-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <NavLink to="/collection">Products</NavLink>
        <ChevronRight size={14} />
        <span>{product.category}</span>
        <ChevronRight size={14} />
        <strong>{product.title}</strong>
      </nav>
      <div className="detail-layout">
        <aside className="detail-thumbs" aria-label={`${product.title} photos`}>
          {(product.imageUrls ?? []).map((imageUrl, index) => (
            <button
              className={selectedImageIndex === index ? 'is-active' : ''}
              key={imageUrl}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              aria-label={`View ${product.title} photo ${index + 1}`}
              aria-pressed={selectedImageIndex === index}
            >
              <img src={imageUrl} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </aside>
        <section className="detail-gallery">
          <ProductMedia product={product} imageIndex={selectedImageIndex} />
          {imageCount ? (
            <span>
              Photo {selectedImageIndex + 1} of {imageCount}
            </span>
          ) : null}
        </section>
        <section className="detail-main">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.title}</h1>
          <p>{product.copy}</p>
          {product.includes?.length ? (
            <div className="detail-includes">
              {product.includes.map((item) => (
                <span key={item}>
                  <Check size={14} />
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </section>
        <aside className="detail-buybox">
          <div className="buybox-price">
            <span>Price on Etsy</span>
            <small>Made to order</small>
          </div>
          <p className="buybox-etsy-note">{getEtsyOptionsNote(product)}</p>
          <EtsyLink product={product} />
          <div className="buybox-notes">
            <span>
              <Package size={16} />
              Printed after you check out on Etsy
            </span>
            <span>
              <Truck size={16} />
              Payment, shipping, and order updates through Etsy
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ProductMedia({ product, imageIndex = 0 }) {
  const imageUrl = product.imageUrls?.[imageIndex] ?? product.imageUrls?.[0];

  if (!imageUrl) {
    return <div className="product-photo product-photo-missing" role="img" aria-label={`${product.title} photo coming soon`} />;
  }

  return (
    <img
      className="product-photo"
      src={imageUrl}
      alt={`${product.title}, photo ${imageIndex + 1}`}
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
      {label} <ArrowUpRight size={17} aria-hidden="true" />
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
      {label} <ArrowUpRight size={17} aria-hidden="true" />
    </a>
  );
}

function FilterGroup({ icon, title, options, active, counts, onSelect }) {
  return (
    <section className="filter-card">
      <h2>
        {icon}
        {title}
      </h2>
      <div className="filter-list">
        {options.map((option) => (
          <button
            className={active === option ? 'is-active' : ''}
            key={option}
            type="button"
            aria-pressed={active === option}
            onClick={() => onSelect(option)}
          >
            <span>{option}</span>
            <strong>{counts[option] ?? 0}</strong>
          </button>
        ))}
      </div>
    </section>
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
    <footer className="footer">
      <div className="footer-brand">
        <span className="footer-mark">
          <img src={brandLogo} alt="" width="48" height="48" loading="lazy" decoding="async" />
        </span>
        <div>
          <strong>Gadjit Prints</strong>
          <p>Custom 3D printed pieces, made to order and sold on Etsy.</p>
        </div>
      </div>
      <div className="footer-links">
        <NavLink className="text-link" to="/collection">
          Browse products <ArrowRight size={17} />
        </NavLink>
        <ShopLink />
      </div>
      <p className="footer-notice">
        The term 'Etsy' is a trademark of Etsy, Inc. This Application uses Etsy's API, but is not endorsed or
        certified by Etsy.
      </p>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
