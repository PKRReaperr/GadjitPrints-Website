import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigate, NavLink, Route, BrowserRouter as Router, Routes, useLocation, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers3,
  Menu,
  Package,
  PenTool,
  RotateCcw,
  Ruler,
  SlidersHorizontal,
  Sparkles,
  Star,
  Truck,
  X,
} from 'lucide-react';
import './styles.css';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/collection', label: 'Products' },
  { to: '/process', label: 'Process' },
  { to: '/studio', label: 'Studio' },
];

const studioEmail = 'hello@gadjitprints.store';
const brandLogo = '/brand/gadjitprints-logo.webp';

const materialInfo = {
  PLA: {
    title: 'PLA',
    summary: 'Best for decorative pieces, gifts, display objects, and lower-cost orders.',
    pros: 'Affordable, crisp detail, broad color range, clean matte finishes.',
    cons: 'More brittle than PETG and not ideal for hot cars, high stress, or long sun exposure.',
  },
  PETG: {
    title: 'PETG',
    summary: 'Best for stronger functional pieces that need more flex and day-to-day toughness.',
    pros: 'More impact resistant than PLA, better layer strength, handles moisture well.',
    cons: 'Slightly less crisp visually and usually costs more than PLA.',
  },
  ABS: {
    title: 'ABS',
    summary: 'Best for sun, heat, outdoor exposure, and pieces that may live in warm places.',
    pros: 'Good heat resistance, better UV/sun suitability, strong for practical use.',
    cons: 'Fewer color options, rougher print behavior, and a higher-cost production setup.',
  },
};

const colorLibrary = {
  'Silk hot pink': {
    swatch: '#ff4faf',
    swatchStyle: 'linear-gradient(135deg, #ff9bd4, #ff4faf 48%, #b71374)',
    materials: ['PLA'],
  },
  'Silk purple': {
    swatch: '#8d50d8',
    swatchStyle: 'linear-gradient(135deg, #c6a0ff, #8d50d8 52%, #4b238f)',
    materials: ['PLA'],
  },
  Orange: { swatch: '#f47a24', materials: ['PLA'] },
  'Glow blue': {
    swatch: '#7ad8ff',
    swatchStyle: 'radial-gradient(circle at 35% 30%, #e8fbff, #7ad8ff 52%, #2f83bb)',
    materials: ['PLA'],
    priceAdd: 5,
    priceNote: 'Glow PLA +$5',
  },
  Green: { swatch: '#32a852', materials: ['PLA', 'PETG'] },
  Blue: { swatch: '#2466e8', materials: ['PLA', 'PETG'] },
  Red: { swatch: '#d6292f', materials: ['PLA', 'PETG'] },
  White: { swatch: '#f5f1e8', materials: ['PLA', 'PETG', 'ABS'] },
  Black: { swatch: '#11100e', materials: ['PLA', 'PETG', 'ABS'] },
  'Galaxy black': {
    swatch: '#17171c',
    swatchStyle: 'radial-gradient(circle at 30% 28%, #d6d0ff 0 2px, transparent 3px), radial-gradient(circle at 66% 62%, #9bdcff 0 1px, transparent 3px), linear-gradient(135deg, #2d2d38, #111117)',
    materials: ['PLA'],
    priceAdd: 4,
    priceNote: 'Galaxy PLA +$4',
  },
};

const colorNames = Object.keys(colorLibrary);
const productColors = colorNames.map((name) => ({ name, ...colorLibrary[name] }));

const qrStandTemplates = {
  Custom: {
    topText: '',
    bottomText: '',
    qrContent: '',
    bottomLogoNotes: '',
  },
  'Facebook Stand': {
    topText: 'Follow Us!',
    bottomText: 'Facebook',
    qrContent: 'Facebook page link',
    bottomLogoNotes: '',
  },
  'Zelle Stand': {
    topText: 'Pay With Zelle',
    bottomText: 'Scan to Pay',
    qrContent: 'Zelle payment QR link or payment details',
    bottomLogoNotes: '',
  },
  'Instagram Stand': {
    topText: 'Follow Us!',
    bottomText: 'Instagram',
    qrContent: 'Instagram profile link',
    bottomLogoNotes: '',
  },
};

const products = [
  {
    slug: 'qr-business-card',
    title: 'QR Business Card',
    type: 'Custom contact card',
    category: 'Business & Branding',
    variant: 'business-card',
    sourceUrl: 'https://makerworld.com/en/models/2584791-business-card-bc036qr?from=recommend#profileId-2851280',
    imageUrls: [
      'https://wsrv.3dprinterfiles.com/?h=828&n=40&output=webp&q=100&url=https%3A%2F%2Fmakerworld.bblmw.com%2Fmakerworld%2Fmodel%2FUSa79b282bc488cd%2Fdesign%2F98883af3adbe048c.png&w=828',
      'https://wsrv.3dprinterfiles.com/?h=828&n=40&output=webp&q=100&url=https%3A%2F%2Fmakerworld.bblmw.com%2Fmakerworld%2Fmodel%2FUSa79b282bc488cd%2Fdesign%2Fbe65cd04b4540925.jpg&w=828',
    ],
    copy: 'A rigid printed business card with raised text, a scannable QR area, and a clean pocketable profile.',
    colors: productColors,
    config: ['Name and title', 'QR destination', 'Logo or small icon'],
    price: 'From $18',
    leadTime: '2-4 studio days',
    dimensions: 'Standard card footprint',
    finish: 'Flat two-tone detail',
    includes: ['QR code area', 'Custom name text', 'Optional logo mark'],
  },
  {
    slug: 'qr-code-business-stand',
    title: 'QR Code Business Stand',
    type: 'In-house QR display stand',
    category: 'Business & Branding',
    variant: 'qr-plate',
    badge: 'In-house design',
    configureType: 'qr-stand',
    imageUrls: [
      '/products/qr-code-business-stand-hero.webp',
      '/products/qr-code-business-stand-print-bed.webp',
    ],
    copy: 'A custom counter stand for QR payments, social follows, menus, contact links, booths, and small business displays.',
    colors: productColors,
    config: ['Top text', 'QR color', 'Bottom text or logo', 'Rear ornament'],
    price: 'From $35',
    leadTime: '7-10 studio days',
    dimensions: 'Countertop display scale',
    finish: 'Multi-color raised QR display',
    includes: ['In-house stand design', 'Custom text zones', 'QR code panel', 'Optional rear ornament'],
    inHouseNote: 'Designed entirely in house by Gadjit Prints. The base plate, QR panel, text boxes, bottom logo area, and optional rear ornament can be tuned for each order.',
  },
  {
    slug: 'initial-ornament-name',
    title: 'Initial Ornament & Name',
    type: 'Personal ornament',
    category: 'Ornaments & Gifts',
    variant: 'ornament',
    sourceUrl: 'https://makerworld.com/en/models/2740326-fully-customizable-initial-ornament-and-name#profileId-3038641',
    customizeUrl: 'https://makerworld.com/en/makerlab/parametricModelMaker?designId=2740326&from=model_page&modelName=nombre-v3.scad&protected=true&unikey=a926126f-79e1-4363-aeeb-382ea6aede75',
    imageUrls: ['/products/initial-ornament-name.png'],
    copy: 'A personalized ornament built around a large initial, custom name text, and a finished hanging loop.',
    colors: productColors,
    config: ['Initial letter', 'Name text', 'Loop style'],
    price: 'From $16',
    leadTime: '2-4 studio days',
    dimensions: '3-5 in ornament span',
    finish: 'Layered raised lettering',
    includes: ['Large initial', 'Custom name', 'Hanging loop'],
  },
  {
    slug: 'custom-door-hanger',
    title: 'Custom Door Hanger',
    type: 'Door sign',
    category: 'Signs & Labels',
    variant: 'door-hanger',
    sourceUrl: 'https://makerworld.com/en/models/2737514-customizable-door-hanger-text-svg-emoji-support#profileId-3035138',
    imageUrls: ['/products/custom-door-hanger.png'],
    copy: 'A customizable door hanger with text, SVG, or emoji-style artwork support for rooms, studios, and events.',
    colors: productColors,
    config: ['Front text', 'Icon or SVG', 'Single or two-tone'],
    price: 'From $22',
    leadTime: '3-5 studio days',
    dimensions: 'Standard door-hanger scale',
    finish: 'Durable readable face',
    includes: ['Custom phrase', 'Graphic option', 'Door knob cutout'],
  },
  {
    slug: 'qr-luggage-bag-tag',
    title: 'QR Luggage / Bag Tag',
    type: 'Travel tag',
    category: 'Travel & Gear',
    variant: 'bag-tag',
    sourceUrl: 'https://makerworld.com/en/models/710726-custom-qr-code-luggage-bag-tag?from=search#profileId-641133',
    imageUrls: [
      'https://makerworld.bblmw.com/makerworld/model/USc7eb59bdce5c4b/design/2024-10-17_4706bf9541546.jpg?x-oss-process=image%2Fresize%2Cw_1000%2Fformat%2Cwebp',
      'https://makerworld.bblmw.com/makerworld/model/USc7eb59bdce5c4b/design/2024-10-17_6e2de6ddb58ca.jpg?x-oss-process=image%2Fresize%2Cw_1000%2Fformat%2Cwebp',
    ],
    copy: 'A custom travel tag with a QR code, name field, and sturdy strap slot for luggage, backpacks, and gear bags.',
    colors: productColors,
    config: ['QR destination', 'Name or handle', 'Tag size'],
    price: 'From $20',
    leadTime: '2-4 studio days',
    dimensions: 'Medium or large tag',
    finish: 'Raised QR and text panel',
    includes: ['QR code panel', 'Name field', 'Strap slot'],
  },
  {
    slug: 'qr-nameplate-stand',
    title: 'QR Name Plate Stand',
    type: 'Desk or wall nameplate',
    category: 'Business & Branding',
    variant: 'qr-plate',
    sourceUrl: 'https://makerworld.com/en/models/2614672-customizable-qr-code-name-plate-stand-or-wall?from=search#profileId-2885404',
    imageUrls: [
      'https://wsrv.3dprinterfiles.com/?h=828&n=40&output=webp&q=100&url=https%3A%2F%2Fmakerworld.bblmw.com%2Fmakerworld%2Fmodel%2FUS86fd7a65b8c7f0%2Fdesign%2F0c7a09d0b146db1f.jpg&w=828',
      'https://wsrv.3dprinterfiles.com/?h=828&n=40&output=webp&q=100&url=https%3A%2F%2Fmakerworld.bblmw.com%2Fmakerworld%2Fmodel%2FUS86fd7a65b8c7f0%2Fdesign%2F589c7773c818d9aa.jpg&w=828',
      'https://wsrv.3dprinterfiles.com/?h=828&n=40&output=webp&q=100&url=https%3A%2F%2Fmakerworld.bblmw.com%2Fmakerworld%2Fmodel%2FUS86fd7a65b8c7f0%2Fdesign%2Ff50dbabe572c2658.jpg&w=828',
    ],
    copy: 'A configurable name plate with QR code support that can sit on a desk or mount to a wall.',
    colors: productColors,
    config: ['Display text', 'QR destination', 'Stand or wall mount'],
    price: 'From $26',
    leadTime: '3-5 studio days',
    dimensions: '5-10 in width',
    finish: 'Raised two-tone signage',
    includes: ['QR code panel', 'Custom display name', 'Stand or wall option'],
  },
];

const categories = ['Made-to-order products', 'Color choices', 'Custom text', 'Studio review', 'Small-batch finish', 'Personal details'];

const processSteps = [
  {
    step: '01',
    title: 'Choose a Product',
    text: 'Start with a product from the catalog, then choose the material, available color, finish direction, and content options.',
  },
  {
    step: '02',
    title: 'Configure the Details',
    text: 'Select the layout, size, hooks, labels, initials, QR code, or set count depending on the product.',
  },
  {
    step: '03',
    title: 'Studio Review',
    text: 'The configuration is treated as an outline. Gadjit Prints reviews it, follows up with questions, and shares previews or details before the print is finalized.',
  },
  {
    step: '04',
    title: 'Print & Finish',
    text: 'Your selected product is printed to order, checked, cleaned up, and finished with the material character you chose.',
  },
];

const materials = [
  'PLA: standard color prints',
  'PETG: limited functional colors',
  'ABS: black and white utility prints',
  'Silk PLA: glossy hot pink and purple',
  'Glow PLA: premium blue finish',
  'Galaxy PLA: premium black finish',
  'Made after selection',
];

function App() {
  return (
    <Router>
      <ScrollToTop />
      <SiteShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/collection/:slug/configure" element={<ProductConfigure />} />
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
        <nav className={`nav ${open ? 'is-open' : ''}`}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <NavLink className="header-cta" to="/collection">
          Browse products <ArrowRight size={16} />
        </NavLink>
        <button className="menu-toggle" type="button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>
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
      <Materials />
      <StudioCallout />
    </>
  );
}

function getRandomProducts(count) {
  return [...products]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

function Hero() {
  const [heroProducts] = useState(() => getRandomProducts(3));

  return (
    <section className="hero">
      <div className="hero-media" />
      <div className="hero-veil" />
      <div className="hero-content reveal">
        <p className="eyebrow">Custom 3D prints, made to order</p>
        <h1>Pick a print. Choose the finish. Personalize the details.</h1>
        <p className="hero-copy">
          Gadjit Prints makes practical, giftable, and display-ready pieces that can be customized through available
          colors, materials, names, QR codes, labels, and layout details before they are printed.
        </p>
        <div className="hero-actions">
          <NavLink className="button button-primary" to="/collection">
            Browse products <ArrowRight size={18} />
          </NavLink>
        </div>
      </div>
      <div className="hero-objects" aria-hidden="true">
        {heroProducts.map((product) => (
          <ProductMedia key={product.slug} product={product} selectedColor={product.colors[0]} imageIndex={0} />
        ))}
      </div>
      <div className="hero-specimen float-card">
        <span>Made to order</span>
        <strong>Names, QR codes, colors, signs, tags, gifts, and desk pieces, tuned before production</strong>
      </div>
    </section>
  );
}

function FeaturedWork() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedProduct = products[selectedIndex];
  const previousProduct = () => setSelectedIndex((index) => (index === 0 ? products.length - 1 : index - 1));
  const nextProduct = () => setSelectedIndex((index) => (index === products.length - 1 ? 0 : index + 1));

  return (
    <section className="section">
      <SectionIntro
        label="Made-to-order products"
        title="Useful printed pieces, personalized before they are made."
        copy="Browse products that can be adjusted with available colors, materials, names, QR codes, labels, sizing, and layout details. Nothing is treated like shelf stock."
      />
      <div className="product-carousel reveal">
        <div className="carousel-stage" key={selectedProduct.slug}>
          <NavLink className="carousel-media" to={`/collection/${selectedProduct.slug}`}>
            <ProductMedia product={selectedProduct} selectedColor={selectedProduct.colors[0]} imageIndex={0} />
          </NavLink>
          <div className="carousel-copy">
            <span>{selectedProduct.type}</span>
            <h3>{selectedProduct.title}</h3>
            <p>{selectedProduct.copy}</p>
            <div className="carousel-meta">
              <small>{selectedProduct.price}</small>
              <small>{selectedProduct.leadTime}</small>
              <small>{selectedProduct.config.slice(0, 2).join(' / ')}</small>
            </div>
            <NavLink className="text-link" to={`/collection/${selectedProduct.slug}`}>
              View product <ArrowRight size={17} />
            </NavLink>
          </div>
        </div>
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
                <small>{product.type}</small>
              </button>
            ))}
          </div>
          <button type="button" onClick={nextProduct} aria-label="Next product">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

function CategoryRibbon() {
  return (
    <section className="ribbon">
      <div className="ribbon-track">
        {[...categories, ...categories].map((category, index) => (
          <span key={`${category}-${index}`}>{category}</span>
        ))}
      </div>
    </section>
  );
}

function ProcessPreview() {
  return (
    <section className="section split-section">
      <div className="split-copy reveal">
        <p className="eyebrow">Configuration rhythm</p>
        <h2>A slower, more careful path to the right print.</h2>
        <p>
          You begin with a product, choose the material and its available colors, then add the details that make it yours.
          Gadjit Prints reviews the outline and follows up before production begins.
        </p>
        <NavLink className="text-link" to="/process">
          See the process <ArrowRight size={17} />
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

function Materials() {
  return (
    <section className="section material-section">
      <SectionIntro
        label="Surface and material"
        title="Matte PLA, tougher PETG, heat-aware ABS, and specialty PLA finishes."
        copy="Each product starts with a material choice, then shows only the colors available for that material, so customers choose from real shop options instead of an endless, impossible color wheel."
      />
      <div className="material-grid">
        {materials.map((material) => {
          const materialKey = material.split(':')[0];
          return (
            <div className="material-chip" key={material}>
              <Sparkles size={15} />
              {materialInfo[materialKey] ? (
                <MaterialBadge material={materialKey} selected />
              ) : (
                material
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StudioCallout() {
  return (
    <section className="studio-callout">
      <div className="object-wall" aria-hidden="true">
        <ProductVisual variant={products[3].variant} tone={products[3].colors[2].swatch} />
        <ProductVisual variant={products[1].variant} tone={products[1].colors[0].swatch} />
        <ProductVisual variant={products[0].variant} tone={products[0].colors[2].swatch} />
      </div>
      <div className="studio-panel reveal">
        <p className="eyebrow">Small studio, careful output</p>
        <h2>Custom prints without the complicated ordering process.</h2>
        <p>
          The catalog can grow over time, while each order still gets reviewed, tuned, and printed around the details the
          customer requested.
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
  const [activeMaterial, setActiveMaterial] = useState('All');
  const categories = ['All', ...new Set(products.map((product) => product.category))];
  const materialFilters = ['All', ...new Set(products.flatMap((product) => product.colors.flatMap((color) => color.materials)))];
  const filteredProducts = products.filter((product) => {
    const categoryMatch = activeCategory === 'All' || product.category === activeCategory;
    const materialMatch =
      activeMaterial === 'All' || product.colors.some((color) => color.materials.includes(activeMaterial));

    return categoryMatch && materialMatch;
  });

  return (
    <PageFrame
      label="Products"
      title="Made-to-order 3D prints, ready to personalize."
      copy="Browse available products, choose the material and matching color on each card, then use Configure to outline names, QR codes, labels, sizing, or layout details before the studio reviews the order."
    >
      <div className="catalog-shell">
        <aside className="catalog-filters">
          <div className="filter-heading">
            <span>
              <SlidersHorizontal size={18} />
              Filters
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('All');
                setActiveMaterial('All');
              }}
            >
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
          <FilterGroup
            icon={<Layers3 size={18} />}
            title="Material"
            options={materialFilters}
            active={activeMaterial}
            counts={getMaterialCounts(products)}
            onSelect={setActiveMaterial}
          />
        </aside>
        <div className="product-card-grid">
          {filteredProducts.map((item) => (
            <ProductCard product={item} key={item.title} />
          ))}
        </div>
      </div>
    </PageFrame>
  );
}

function Process() {
  return (
    <PageFrame
      label="Configuration process"
      title="A careful path from product choice to approved print."
      copy="Pick a product, choose a material first, choose from its available colors, add the configurable content, and expect a review before printing begins."
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
        <Note icon={<PenTool />} title="Content options" text="Products can support names, initials, QR codes, labels, phrases, icons, or other product-specific details." />
        <Note icon={<Layers3 />} title="Configuration by product" text="Each item has its own adjustable details: layouts, hooks, tags, signs, labels, sizing, mounting, or set count." />
        <Note icon={<Check />} title="Made after selection" text="Orders are not pulled from a shelf. They are reviewed, printed, and finished after the customer sends the outline." />
      </div>
    </PageFrame>
  );
}

function Studio() {
  return (
    <PageFrame
      label="About the studio"
      title="A custom 3D printing service for personal, practical pieces."
      copy="Gadjit Prints focuses on bespoke printed goods that can be configured, reviewed, and made after selection instead of pulled from generic shelf inventory."
    >
      <section className="about-layout">
        <div className="about-image reveal" aria-hidden="true">
          <ProductVisual variant={products[1].variant} tone={products[1].colors[0].swatch} />
          <ProductVisual variant={products[0].variant} tone={products[0].colors[0].swatch} />
          <ProductVisual variant={products[3].variant} tone={products[3].colors[2].swatch} />
        </div>
        <div className="about-copy reveal">
          <h2>Not mass produced. Looked over, adjusted, and printed one order at a time.</h2>
          <p>
            The studio exists to make custom 3D prints feel easier to order without losing the personal attention that
            makes a made-to-order piece worthwhile.
          </p>
          <p>
            As a small Houston-area project, Gadjit Prints also has a quiet connection to <a className="text-link" href="https://gadjit.net" target="_blank" rel="noreferrer">Gadjit</a>,
            a camera business with more than 10 years of experience around used and open-box camera gear.
          </p>
          <p>
            Every print is made after the order is outlined, then checked and fine tuned before production. Wait times can
            be longer than a mass-production shop, but the goal is a piece that looks and feels the way you wanted it.
          </p>
          <div className="value-list">
            <span>Custom print service</span>
            <span>Configurable details</span>
            <span>Order-by-order finishing</span>
            <span>Studio communication</span>
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
  const [selectedMaterial, setSelectedMaterial] = useState(getDefaultMaterial(product));
  const materialColors = useMemo(() => getColorsForMaterial(product, selectedMaterial), [product, selectedMaterial]);
  const [selectedColorName, setSelectedColorName] = useState(materialColors[0].name);
  const selectedColor = materialColors.find((color) => color.name === selectedColorName) ?? materialColors[0];

  useEffect(() => {
    if (!materialColors.some((color) => color.name === selectedColorName)) {
      setSelectedColorName(materialColors[0].name);
    }
  }, [materialColors, selectedColorName]);

  return (
    <article className="catalog-card reveal">
      <NavLink
        className="catalog-card-link"
        to={`/collection/${product.slug}`}
        aria-label={`View ${product.title}`}
      />
      <div className="catalog-card-title">
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
        <h3>{product.title}</h3>
      </div>
      <div className="catalog-media">
        <ProductMedia product={product} selectedColor={selectedColor} imageIndex={0} />
      </div>
      <div className="catalog-specs">
        <div>
          <strong>Type</strong>
          <span>{product.type}</span>
        </div>
        <div>
          <strong>Selected</strong>
          <span>{getConfigurationLabel(selectedColor, selectedMaterial)}</span>
        </div>
      </div>
      <div className="catalog-options">
        <OptionGroup title="Material">
          <MaterialChoices
            product={product}
            selectedMaterial={selectedMaterial}
            onSelectMaterial={setSelectedMaterial}
          />
        </OptionGroup>
        <OptionGroup title={`${selectedMaterial} colors`}>
          <ColorSwatches
            colors={materialColors}
            selectedColor={selectedColorName}
            onSelectColor={setSelectedColorName}
          />
        </OptionGroup>
      </div>
      <div className="catalog-tags">
        {product.config.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <NavLink className="configure-button" to={`/collection/${product.slug}/configure`}>
        Configure
      </NavLink>
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

function ProductDetailContent({ product }) {
  const [selectedMaterial, setSelectedMaterial] = useState(getDefaultMaterial(product));
  const materialColors = useMemo(() => getColorsForMaterial(product, selectedMaterial), [product, selectedMaterial]);
  const [selectedColorName, setSelectedColorName] = useState(materialColors[0].name);
  const selectedColor = materialColors.find((color) => color.name === selectedColorName) ?? materialColors[0];
  const hasProductPhotos = product.imageUrls?.length > 0;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!materialColors.some((color) => color.name === selectedColorName)) {
      setSelectedColorName(materialColors[0].name);
    }
  }, [materialColors, selectedColorName]);

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
        <aside className="detail-thumbs" aria-label={`${product.title} views`}>
          {hasProductPhotos
            ? product.imageUrls.map((imageUrl, index) => (
                <button
                  className={selectedImageIndex === index ? 'is-active' : ''}
                  key={imageUrl}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`View ${product.title} photo ${index + 1}`}
                >
                  <img src={imageUrl} alt="" loading="lazy" decoding="async" />
                </button>
              ))
            : [materialColors[0], materialColors[1], materialColors[2], selectedColor].filter(Boolean).map((color, index) => (
                <button
                  className={color.name === selectedColor.name ? 'is-active' : ''}
                  key={`${color.name}-${index}`}
                  type="button"
                  onClick={() => setSelectedColorName(color.name)}
                  aria-label={`View ${product.title} in ${color.name}`}
                >
                  <ProductVisual variant={product.variant} tone={color.swatch} />
                </button>
              ))}
        </aside>
        <section className="detail-gallery">
          <ProductMedia product={product} selectedColor={selectedColor} imageIndex={selectedImageIndex} />
          <span>{hasProductPhotos ? `Reference photo ${selectedImageIndex + 1}` : `Selected finish: ${selectedColor.name}`}</span>
        </section>
        <section className="detail-main">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.title}</h1>
          <p>{product.copy}</p>
          {product.inHouseNote ? (
            <div className="detail-callout">
              <strong>{product.badge}</strong>
              <span>{product.inHouseNote}</span>
            </div>
          ) : null}
          <div className="detail-rating">
            <span>Studio reviewed</span>
            <span>
              {[0, 1, 2, 3, 4].map((star) => (
                <Star key={star} size={15} fill="currentColor" />
              ))}
            </span>
          </div>
          <dl className="detail-spec-table">
            <div>
              <dt>Price</dt>
              <dd>{getPriceDisplay(product, selectedColor)}</dd>
            </div>
            <div>
              <dt>Lead time</dt>
              <dd>{product.leadTime}</dd>
            </div>
            <div>
              <dt>Dimensions</dt>
              <dd>{product.dimensions}</dd>
            </div>
            <div>
              <dt>Finish</dt>
              <dd>{product.finish}</dd>
            </div>
          </dl>
          <div className="detail-includes">
            {product.includes.map((item) => (
              <span key={item}>
                <Check size={14} />
                {item}
              </span>
            ))}
          </div>
          {product.sourceUrl ? (
            <a className="reference-link" href={product.sourceUrl} target="_blank" rel="noreferrer">
              View reference model <ArrowRight size={16} />
            </a>
          ) : null}
        </section>
        <aside className="detail-buybox">
          <div className="buybox-price">
            <span>{getPriceDisplay(product, selectedColor)}</span>
            <small>{selectedColor.priceNote ?? 'Made after selection'}</small>
          </div>
          <OptionGroup title="Material">
            <MaterialChoices
              product={product}
              selectedMaterial={selectedMaterial}
              onSelectMaterial={setSelectedMaterial}
            />
          </OptionGroup>
          <OptionGroup title={`${selectedMaterial} colors`}>
            <ColorSwatches colors={materialColors} selectedColor={selectedColorName} onSelectColor={setSelectedColorName} />
          </OptionGroup>
          <div className="buybox-selected">
            <strong>Current configuration</strong>
            <span>{getConfigurationLabel(selectedColor, selectedMaterial)}</span>
          </div>
          <NavLink className="button button-primary" to={`/collection/${product.slug}/configure`}>
            Configure selection <ArrowRight size={17} />
          </NavLink>
          <div className="buybox-notes">
            <span>
              <Truck size={16} />
              Local made-to-order production
            </span>
            <span>
              <Ruler size={16} />
              Configuration reviewed before printing
            </span>
            <span>
              <RotateCcw size={16} />
              Preview details confirmed by studio
            </span>
            <span>
              <Info size={16} />
              Hover materials for durability notes
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ProductConfigure() {
  const { slug } = useParams();
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    return <Navigate to="/collection" replace />;
  }

  return <ProductConfigureContent product={product} />;
}

function ProductConfigureContent({ product }) {
  const [selectedMaterial, setSelectedMaterial] = useState(getDefaultMaterial(product));
  const materialColors = useMemo(() => getColorsForMaterial(product, selectedMaterial), [product, selectedMaterial]);
  const [selectedColorName, setSelectedColorName] = useState(materialColors[0].name);
  const selectedColor = materialColors.find((color) => color.name === selectedColorName) ?? materialColors[0];
  const [form, setForm] = useState(() => getDefaultConfigureForm(product));
  const [copied, setCopied] = useState(false);
  const summary = getConfigurationSummary(product, selectedColor, selectedMaterial, form);
  const emailHref = getConfigurationEmailHref(product, summary);

  useEffect(() => {
    if (!materialColors.some((color) => color.name === selectedColorName)) {
      setSelectedColorName(materialColors[0].name);
    }
  }, [materialColors, selectedColorName]);

  useEffect(() => {
    const defaultMaterial = getDefaultMaterial(product);
    const defaultColors = getColorsForMaterial(product, defaultMaterial);
    setSelectedMaterial(defaultMaterial);
    setSelectedColorName(defaultColors[0].name);
    setForm(getDefaultConfigureForm(product));
    setCopied(false);
  }, [product]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setCopied(false);
  }

  async function copyConfiguration() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
  }

  return (
    <section className="configure-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <NavLink to="/collection">Products</NavLink>
        <ChevronRight size={14} />
        <NavLink to={`/collection/${product.slug}`}>{product.title}</NavLink>
        <ChevronRight size={14} />
        <strong>Configure</strong>
      </nav>
      <div className="configure-layout">
        <aside className="configure-preview">
          <ProductMedia product={product} selectedColor={selectedColor} imageIndex={0} />
          <div>
            <p className="eyebrow">{product.category}</p>
            <h1>{product.title}</h1>
            <p>{product.copy}</p>
          </div>
          <div className="configure-preview-specs">
            <span>{getPriceDisplay(product, selectedColor)}</span>
            <span>{product.leadTime}</span>
            <span>{product.dimensions}</span>
          </div>
        </aside>

        <section className="configure-form-panel">
          <ConfigureGroup title={product.configureType === 'qr-stand' ? 'Base plate finish' : 'Finish'}>
            <MaterialChoices
              product={product}
              selectedMaterial={selectedMaterial}
              onSelectMaterial={setSelectedMaterial}
            />
            <ColorSwatches colors={materialColors} selectedColor={selectedColorName} onSelectColor={setSelectedColorName} />
            <div className="buybox-selected">
              <strong>{product.configureType === 'qr-stand' ? 'Selected base plate' : 'Selected finish'}</strong>
              <span>{getConfigurationLabel(selectedColor, selectedMaterial)}</span>
            </div>
          </ConfigureGroup>

          {product.configureType === 'qr-stand' ? (
            <QrStandConfigureFields form={form} updateField={updateField} />
          ) : (
            <GenericConfigureFields form={form} updateField={updateField} />
          )}

          <ConfigureGroup title="Contact">
            <label className="field-control">
              <span>Your name</span>
              <input value={form.customerName} onChange={(event) => updateField('customerName', event.target.value)} />
            </label>
            <label className="field-control">
              <span>Your email or phone</span>
              <input value={form.customerContact} onChange={(event) => updateField('customerContact', event.target.value)} />
            </label>
          </ConfigureGroup>
        </section>

        <aside className="configure-summary">
          <p className="eyebrow">Ready to send</p>
          <h2>Configuration summary</h2>
          <div className="outline-disclaimer">
            <strong>This is an outline, not the final print plan.</strong>
            <span>
              After you send it, the Gadjit Prints team will review the details, contact you about specifics, and share
              previews or confirmation notes before production begins.
            </span>
          </div>
          <pre>{summary}</pre>
          <div className="configure-actions">
            <a className="button button-primary" href={emailHref}>
              Email configuration <ArrowRight size={17} />
            </a>
            <button className="button button-ghost" type="button" onClick={copyConfiguration}>
              {copied ? 'Copied' : 'Copy summary'}
            </button>
            {getCustomizeUrl(product) ? (
              <a className="text-link" href={getCustomizeUrl(product)} target="_blank" rel="noreferrer">
                Open MakerWorld reference <ArrowRight size={16} />
              </a>
            ) : null}
          </div>
          <p className="configure-note">
            Email apps cannot attach logo files automatically. After the draft opens, attach any SVG, PNG, JPEG, or
            reference file you want used. The studio may request additional files or changes after reviewing your outline.
          </p>
        </aside>
      </div>
    </section>
  );
}

function GenericConfigureFields({ form, updateField }) {
  return (
    <>
      <ConfigureGroup title="Personal details">
        <label className="field-control">
          <span>Main text</span>
          <input value={form.mainText} onChange={(event) => updateField('mainText', event.target.value)} />
        </label>
        <label className="field-control">
          <span>Secondary text</span>
          <input value={form.secondaryText} onChange={(event) => updateField('secondaryText', event.target.value)} />
        </label>
        <label className="field-control">
          <span>QR code link or content</span>
          <input value={form.qrContent} onChange={(event) => updateField('qrContent', event.target.value)} placeholder="Website, profile, contact card, or message" />
        </label>
        <label className="field-control">
          <span>Logo or file notes</span>
          <input value={form.logoNotes} onChange={(event) => updateField('logoNotes', event.target.value)} placeholder="Describe logo, SVG, image, or file you will send" />
        </label>
      </ConfigureGroup>

      <ConfigureGroup title="Size and layout">
        <div className="segmented-row" aria-label="Layout style">
          {['Standard', 'Compact', 'Large'].map((layout) => (
            <button
              className={form.layout === layout ? 'is-active' : ''}
              key={layout}
              type="button"
              onClick={() => updateField('layout', layout)}
            >
              {layout}
            </button>
          ))}
        </div>
        <label className="field-control">
          <span>Requested size</span>
          <input value={form.size} onChange={(event) => updateField('size', event.target.value)} placeholder="Example: 4 in wide, standard, larger tag" />
        </label>
        <label className="field-control">
          <span>Notes for the studio</span>
          <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Placement, spelling, deadline, gift notes, usage, or anything specific." />
        </label>
      </ConfigureGroup>
    </>
  );
}

function QrStandConfigureFields({ form, updateField }) {
  function applyTemplate(template) {
    const templateDefaults = qrStandTemplates[template];
    updateField('template', template);
    updateField('topText', templateDefaults.topText);
    updateField('bottomText', templateDefaults.bottomText);
    updateField('qrContent', templateDefaults.qrContent);
    updateField('bottomLogoNotes', templateDefaults.bottomLogoNotes);
  }

  return (
    <>
      <ConfigureGroup title="Template">
        <div className="segmented-row template-row" aria-label="QR stand template">
          {Object.keys(qrStandTemplates).map((template) => (
            <button
              className={form.template === template ? 'is-active' : ''}
              key={template}
              type="button"
              onClick={() => applyTemplate(template)}
            >
              {template}
            </button>
          ))}
        </div>
      </ConfigureGroup>

      <ConfigureGroup title="Front content">
        <label className="field-control">
          <span>Top text</span>
          <input value={form.topText} onChange={(event) => updateField('topText', event.target.value)} placeholder="Example: Follow Us!, Pay With Zelle, Scan Here" />
        </label>
        <label className="field-control">
          <span>Bottom text</span>
          <input value={form.bottomText} onChange={(event) => updateField('bottomText', event.target.value)} placeholder="Used when no bottom logo is requested" />
        </label>
        <label className="field-control">
          <span>Bottom logo notes</span>
          <input value={form.bottomLogoNotes} onChange={(event) => updateField('bottomLogoNotes', event.target.value)} placeholder="Optional. Replaces bottom text when used." />
        </label>
        <p className="field-note">If a bottom logo is used, it replaces the bottom text area.</p>
        <label className="field-control">
          <span>QR code link or content</span>
          <input value={form.qrContent} onChange={(event) => updateField('qrContent', event.target.value)} placeholder="Payment link, social profile, menu, contact card, or website" />
        </label>
      </ConfigureGroup>

      <ConfigureGroup title="Color zones">
        <ColorZonePicker label="Text box color" value={form.textBoxColor} onChange={(value) => updateField('textBoxColor', value)} />
        <ColorZonePicker label="QR code color" value={form.qrColor} onChange={(value) => updateField('qrColor', value)} />
        <ColorZonePicker label="Rear ornament color" value={form.rearOrnamentColor} onChange={(value) => updateField('rearOrnamentColor', value)} />
      </ConfigureGroup>

      <ConfigureGroup title="Rear ornament and notes">
        <div className="segmented-row" aria-label="Rear ornament">
          {['None', 'Custom ornament requested'].map((ornament) => (
            <button
              className={form.rearOrnament === ornament ? 'is-active' : ''}
              key={ornament}
              type="button"
              onClick={() => updateField('rearOrnament', ornament)}
            >
              {ornament}
            </button>
          ))}
        </div>
        <label className="field-control">
          <span>Ornament name or idea</span>
          <input value={form.size} onChange={(event) => updateField('size', event.target.value)} placeholder="Example: wizard hat, camera, flower, logo shape, simple initials" />
        </label>
        <label className="field-control">
          <span>Additional notes</span>
          <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Business use, placement, deadline, logo file details, ornament idea, or anything specific." />
        </label>
      </ConfigureGroup>
    </>
  );
}

function ColorZonePicker({ label, value, onChange }) {
  return (
    <div className="color-zone-picker">
      <strong>{label}</strong>
      <ColorSwatches colors={productColors} selectedColor={value} onSelectColor={onChange} />
    </div>
  );
}

function ConfigureGroup({ title, children }) {
  return (
    <section className="configure-group">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ProductMedia({ product, selectedColor, imageIndex = 0 }) {
  const imageUrl = product.imageUrls?.[imageIndex] ?? product.imageUrls?.[0];

  if (imageUrl) {
    return (
      <img
        className="product-photo"
        src={imageUrl}
        alt={`${product.title} sample print`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return <ProductVisual variant={product.variant} tone={selectedColor.swatch} />;
}

function getPriceDisplay(product, selectedColor) {
  return selectedColor.priceAdd ? `${product.price} + $${selectedColor.priceAdd}` : product.price;
}

function getCustomizeUrl(product) {
  return product.customizeUrl ?? product.sourceUrl;
}

function getDefaultConfigureForm(product) {
  const defaults = {
    'qr-business-card': {
      mainText: 'Your Name',
      secondaryText: 'Title or business name',
      qrContent: 'Website or contact link',
      size: 'Standard card size',
    },
    'initial-ornament-name': {
      mainText: 'Sofia',
      secondaryText: 'S',
      qrContent: '',
      size: 'Standard ornament size',
    },
    'custom-door-hanger': {
      mainText: 'Do Not Disturb',
      secondaryText: 'Custom lower text',
      qrContent: '',
      size: 'Standard door hanger',
    },
    'qr-luggage-bag-tag': {
      mainText: 'Name or handle',
      secondaryText: 'Return if found',
      qrContent: 'Contact or luggage profile link',
      size: 'Medium tag',
    },
    'qr-nameplate-stand': {
      mainText: 'Display name',
      secondaryText: 'Title or handle',
      qrContent: 'Profile, menu, portfolio, or contact link',
      size: 'Standard desktop stand',
    },
    'qr-code-business-stand': {
      mainText: '',
      secondaryText: '',
      qrContent: 'Payment link, social profile, menu, contact card, or website',
      size: 'Standard counter stand',
    },
  };

  return {
    mainText: defaults[product.slug]?.mainText ?? '',
    secondaryText: defaults[product.slug]?.secondaryText ?? '',
    qrContent: defaults[product.slug]?.qrContent ?? '',
    logoNotes: '',
    template: 'Custom',
    topText: '',
    bottomText: '',
    bottomLogoNotes: '',
    textBoxColor: 'White',
    qrColor: 'Black',
    rearOrnament: 'None',
    rearOrnamentColor: 'Orange',
    layout: 'Standard',
    size: defaults[product.slug]?.size ?? '',
    notes: '',
    customerName: '',
    customerContact: '',
  };
}

function getConfigurationSummary(product, selectedColor, selectedMaterial, form) {
  if (product.configureType === 'qr-stand') {
    return [
      'NOTE: This configuration is an outline, not the final print plan.',
      'Gadjit Prints will review it, communicate about specifics, and send previews or confirmation details before production.',
      '',
      `Product: ${product.title}`,
      `Category: ${product.category}`,
      `Estimated price: ${getPriceDisplay(product, selectedColor)}`,
      `Template: ${form.template || 'Custom'}`,
      `Base plate color: ${selectedColor.name}`,
      `Material: ${selectedMaterial}`,
      `Premium base finish: ${selectedColor.priceNote ?? 'None'}`,
      `Text box color: ${form.textBoxColor || 'Not provided'}`,
      `QR code color: ${form.qrColor || 'Not provided'}`,
      `Rear ornament: ${form.rearOrnament || 'None'}`,
      `Rear ornament color: ${form.rearOrnamentColor || 'Not provided'}`,
      `Top text: ${form.topText || 'Not provided'}`,
      `Bottom text: ${form.bottomText || 'Not provided'}`,
      `Bottom logo notes: ${form.bottomLogoNotes || 'None'}`,
      'Bottom content rule: Bottom logo replaces bottom text when provided.',
      `QR code content: ${form.qrContent || 'Not provided'}`,
      `Ornament name or idea: ${form.size || 'Not provided'}`,
      `Additional notes: ${form.notes || 'None'}`,
      `Customer name: ${form.customerName || 'Not provided'}`,
      `Customer contact: ${form.customerContact || 'Not provided'}`,
      'Reference model: In-house Gadjit Prints design',
    ].join('\n');
  }

  return [
    'NOTE: This configuration is an outline, not the final print plan.',
    'Gadjit Prints will review it, communicate about specifics, and send previews or confirmation details before production.',
    '',
    `Product: ${product.title}`,
    `Category: ${product.category}`,
    `Estimated price: ${getPriceDisplay(product, selectedColor)}`,
    `Color: ${selectedColor.name}`,
    `Material: ${selectedMaterial}`,
    `Premium finish: ${selectedColor.priceNote ?? 'None'}`,
    `Main text: ${form.mainText || 'Not provided'}`,
    `Secondary text: ${form.secondaryText || 'Not provided'}`,
    `QR code content: ${form.qrContent || 'Not provided'}`,
    `Logo/file notes: ${form.logoNotes || 'None'}`,
    `Layout: ${form.layout}`,
    `Requested size: ${form.size || 'Not provided'}`,
    `Studio notes: ${form.notes || 'None'}`,
    `Customer name: ${form.customerName || 'Not provided'}`,
    `Customer contact: ${form.customerContact || 'Not provided'}`,
    `Reference model: ${product.sourceUrl ?? 'In-house Gadjit Prints design'}`,
  ].join('\n');
}

function getConfigurationEmailHref(product, summary) {
  const subject = encodeURIComponent(`Gadjit Prints configuration: ${product.title}`);
  const body = encodeURIComponent(`${summary}\n\nPlease attach any logo, SVG, image, or reference files before sending.`);
  return `mailto:${studioEmail}?subject=${subject}&body=${body}`;
}

function getConfigurationLabel(selectedColor, selectedMaterial) {
  return selectedColor.priceAdd
    ? `${selectedColor.name} / ${selectedMaterial} (+$${selectedColor.priceAdd})`
    : `${selectedColor.name} / ${selectedMaterial}`;
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
      All: items.length,
    }),
    { All: items.length }
  );
}

function getMaterialCounts(items) {
  return items.reduce(
    (counts, product) => {
      const productMaterials = new Set(product.colors.flatMap((color) => color.materials));
      productMaterials.forEach((material) => {
        counts[material] = (counts[material] ?? 0) + 1;
      });
      counts.All = items.length;
      return counts;
    },
    { All: items.length }
  );
}

function getProductMaterials(product) {
  const availableMaterials = new Set(product.colors.flatMap((color) => color.materials));
  return Object.keys(materialInfo).filter((material) => availableMaterials.has(material));
}

function getDefaultMaterial(product) {
  return getProductMaterials(product)[0];
}

function getColorsForMaterial(product, material) {
  return product.colors.filter((color) => color.materials.includes(material));
}

function OptionGroup({ title, children }) {
  return (
    <div className="option-group">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

function ColorSwatches({ colors, selectedColor, onSelectColor }) {
  return (
    <div className="swatch-grid">
      {colors.map((color) => (
        <button
          className={`swatch-option ${selectedColor === color.name ? 'is-selected' : ''}`}
          key={color.name}
          type="button"
          onClick={() => onSelectColor(color.name)}
          aria-pressed={selectedColor === color.name}
        >
          <span style={{ background: color.swatchStyle ?? color.swatch }} />
          <small>
            {color.name}
            {color.priceAdd ? <em>+${color.priceAdd}</em> : null}
          </small>
        </button>
      ))}
    </div>
  );
}

function MaterialChoices({ product, selectedMaterial, onSelectMaterial }) {
  const available = getProductMaterials(product);

  return (
    <div className="material-choice-row">
      {Object.keys(materialInfo).map((material) => {
        const isAvailable = available.includes(material);

        return (
          <MaterialBadge
            key={material}
            material={material}
            selected={selectedMaterial === material}
            disabled={!isAvailable}
            onClick={isAvailable ? () => onSelectMaterial(material) : undefined}
          />
        );
      })}
    </div>
  );
}

function MaterialBadge({ material, selected = false, disabled = false, onClick }) {
  const info = materialInfo[material];
  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      className={`material-badge ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      tabIndex={disabled ? -1 : 0}
      aria-pressed={onClick ? selected : undefined}
      aria-disabled={disabled || undefined}
    >
      {material}
      <span className="material-tooltip" role="tooltip">
        <strong>{info.title}</strong>
        <small>{info.summary}</small>
        <em>Strengths: {info.pros}</em>
        <em>Tradeoffs: {info.cons}</em>
      </span>
    </Tag>
  );
}

function ProductOptions({ product, selectedColor, selectedMaterial }) {
  return (
    <div className="product-options">
      <div>
        <strong>Selected</strong>
        <p>
          {getConfigurationLabel(selectedColor, selectedMaterial)}
        </p>
      </div>
      <div>
        <strong>Available colors</strong>
        <p>{product.colors.map((color) => color.name).join(' / ')}</p>
      </div>
      <div>
        <strong>Config</strong>
        <p>{product.config.join(' / ')}</p>
      </div>
    </div>
  );
}

function ProductVisual({ variant, tone = '#d8d0c1' }) {
  return (
    <div className={`product-visual product-${variant}`} style={{ '--product-tone': tone }} aria-hidden="true">
      <span className="shape shape-a" />
      <span className="shape shape-b" />
      <span className="shape shape-c" />
      <span className="shape shape-d" />
    </div>
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
          <p>Custom 3D printed products, reviewed and tuned before production.</p>
        </div>
      </div>
      <NavLink className="text-link" to="/collection">
        Browse products <ArrowRight size={17} />
      </NavLink>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
