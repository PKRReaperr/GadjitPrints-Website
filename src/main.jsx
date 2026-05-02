import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigate, NavLink, Route, BrowserRouter as Router, Routes, useLocation, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Check,
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
  Bone: { swatch: '#e8ddca', materials: ['PLA', 'PETG'] },
  Charcoal: { swatch: '#24211d', materials: ['PLA', 'PETG', 'ABS'] },
  Clay: { swatch: '#b46f4d', materials: ['PLA'] },
  Smoke: { swatch: '#77736a', materials: ['PLA', 'PETG'] },
  Graphite: { swatch: '#343434', materials: ['PLA', 'PETG', 'ABS'] },
  Stone: { swatch: '#a59c8d', materials: ['PLA', 'PETG'] },
  Amber: { swatch: '#c89652', materials: ['PLA'] },
  Olive: { swatch: '#5d6448', materials: ['PLA', 'PETG'] },
  'Satin black': { swatch: '#11100e', materials: ['PLA', 'PETG', 'ABS'] },
  Mist: { swatch: '#c7cbc2', materials: ['PLA'] },
  'Warm gray': { swatch: '#8b8377', materials: ['PLA', 'PETG'] },
  Moss: { swatch: '#4d5d47', materials: ['PETG', 'ABS'] },
  Sand: { swatch: '#c3ae8d', materials: ['PLA', 'PETG'] },
  'Bone on charcoal': { swatch: '#d9cfbd', materials: ['PLA'] },
  'Amber on black': { swatch: '#c89652', materials: ['PLA', 'PETG'] },
  'Clay on stone': { swatch: '#a56a52', materials: ['PLA'] },
  'White on smoke': { swatch: '#e9e5da', materials: ['PLA', 'PETG'] },
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
    colors: ['Bone', 'Charcoal', 'Amber', 'Stone'].map((name) => ({ name, ...colorLibrary[name] })),
    config: ['Name and title', 'QR destination', 'Logo or small icon'],
    price: 'From $18',
    leadTime: '2-4 studio days',
    dimensions: 'Standard card footprint',
    finish: 'Flat two-tone detail',
    includes: ['QR code area', 'Custom name text', 'Optional logo mark'],
  },
  {
    slug: 'initial-ornament-name',
    title: 'Initial Ornament & Name',
    type: 'Personal ornament',
    category: 'Ornaments & Gifts',
    variant: 'ornament',
    sourceUrl: 'https://makerworld.com/en/models/2740326-fully-customizable-initial-ornament-and-name#profileId-3038641',
    imageUrls: [],
    copy: 'A personalized ornament built around a large initial, custom name text, and a finished hanging loop.',
    colors: ['Bone', 'Clay', 'Amber', 'White on smoke'].map((name) => ({ name, ...colorLibrary[name] })),
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
    imageUrls: [],
    copy: 'A customizable door hanger with text, SVG, or emoji-style artwork support for rooms, studios, and events.',
    colors: ['Charcoal', 'Bone', 'Moss', 'Sand'].map((name) => ({ name, ...colorLibrary[name] })),
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
    colors: ['Graphite', 'Amber', 'Olive', 'Mist'].map((name) => ({ name, ...colorLibrary[name] })),
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
    colors: ['Bone on charcoal', 'Amber on black', 'Clay on stone', 'White on smoke'].map((name) => ({ name, ...colorLibrary[name] })),
    config: ['Display text', 'QR destination', 'Stand or wall mount'],
    price: 'From $26',
    leadTime: '3-5 studio days',
    dimensions: '5-10 in width',
    finish: 'Raised two-tone signage',
    includes: ['QR code panel', 'Custom display name', 'Stand or wall option'],
  },
];

const categories = ['Five studio products', 'Color choices', 'Configured options', 'Made to order', 'Small-batch finish', 'Personal details'];

const processSteps = [
  {
    step: '01',
    title: 'Choose a Product',
    text: 'Start with one of the five studio pieces, then choose the color family, finish direction, and available configuration.',
  },
  {
    step: '02',
    title: 'Configure the Details',
    text: 'Select the layout, size, hooks, inserts, labels, initials, or set count depending on the product.',
  },
  {
    step: '03',
    title: 'Studio Review',
    text: 'The configuration is checked for proportion, printability, and surface quality before production begins.',
  },
  {
    step: '04',
    title: 'Print & Finish',
    text: 'Your selected product is printed to order, cleaned up, and finished with the material character you chose.',
  },
];

const materials = [
  'PLA: affordable, clean, decorative',
  'PETG: stronger, tougher, functional',
  'ABS: sun and heat friendly',
  'Curated color availability',
  'Matte and satin finishes',
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
          <span className="brand-mark">GP</span>
          <span>
            <strong>Gadjit Prints</strong>
            <small>Configurable printed goods</small>
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

function Hero() {
  return (
    <section className="hero">
      <div className="hero-media" />
      <div className="hero-veil" />
      <div className="hero-content reveal">
        <p className="eyebrow">Five configurable studio objects, printed to order</p>
        <h1>Choose the piece. Tune the color. Make it yours.</h1>
        <p className="hero-copy">
          Gadjit Prints offers a focused collection of 3D printed home, desk, and gift objects that can be customized
          through curated colorways, layouts, labels, inserts, and finish details.
        </p>
        <div className="hero-actions">
          <NavLink className="button button-primary" to="/collection">
            Browse products <ArrowRight size={18} />
          </NavLink>
          <NavLink className="button button-ghost" to="/collection">
            View the five pieces <ChevronRight size={18} />
          </NavLink>
        </div>
      </div>
      <div className="hero-objects" aria-hidden="true">
        <ProductVisual variant={products[0].variant} tone={products[0].colors[0].swatch} />
        <ProductVisual variant={products[2].variant} tone={products[2].colors[1].swatch} />
        <ProductVisual variant={products[4].variant} tone={products[4].colors[1].swatch} />
      </div>
      <div className="hero-specimen float-card">
        <span>Studio collection</span>
        <strong>QR cards, ornaments, door hangers, luggage tags, and nameplate stands</strong>
      </div>
    </section>
  );
}

function FeaturedWork() {
  return (
    <section className="section">
      <SectionIntro
        label="The five products"
        title="A tight collection, made personal through options."
        copy="Instead of an open-ended catalog, each product starts from a studio-designed form and becomes yours through color, scale, layout, and detail choices."
      />
      <div className="work-grid">
        {products.slice(0, 3).map((item, index) => (
          <article className="work-card reveal" key={item.title} style={{ transitionDelay: `${index * 80}ms` }}>
            <div className="work-image">
              <ProductVisual variant={item.variant} tone={item.colors[0].swatch} />
            </div>
            <div className="work-body">
              <span>{item.type}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </div>
          </article>
        ))}
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
        <h2>A focused ordering flow, not an anything-goes request box.</h2>
        <p>
          You begin with a designed product, then choose from studio-approved colorways and configuration options so the
          final object feels personal while staying refined.
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
        title="Matte, mineral, satin, translucent, structural."
        copy="Each product is offered in a curated finish range, so color and material feel intentional rather than random."
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
        <p className="eyebrow">Small studio, precise output</p>
        <h2>Designed products with room for your choices.</h2>
        <p>
          The studio keeps the collection intentionally small so every option can be dialed in: color, layout, scale,
          labels, inserts, and finish.
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
  const materialFilters = ['All', ...Object.keys(materialInfo)];
  const filteredProducts = products.filter((product) => {
    const categoryMatch = activeCategory === 'All' || product.category === activeCategory;
    const materialMatch =
      activeMaterial === 'All' || product.colors.some((color) => color.materials.includes(activeMaterial));

    return categoryMatch && materialMatch;
  });

  return (
    <PageFrame
      label="Products"
      title="Configurable products, ready to tune."
      copy="Browse the current studio designs, choose the available color and material on each card, then use Configure when you are ready to shape the details."
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
      title="A careful path from product choice to finished object."
      copy="The process keeps creative control with the studio while giving customers meaningful choices in color, configuration, labeling, and finish."
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
        <Note icon={<PenTool />} title="Curated choices" text="Customers pick from approved options, so every piece stays within the studio's design language." />
        <Note icon={<Layers3 />} title="Configuration by product" text="Each object has its own adjustable details: layouts, hooks, trays, labels, sizing, or set count." />
        <Note icon={<Check />} title="Made after selection" text="Products are printed after the configuration is selected, keeping the work personal without becoming fully bespoke." />
      </div>
    </PageFrame>
  );
}

function Studio() {
  return (
    <PageFrame
      label="About the studio"
      title="A small product studio for configurable printed goods."
      copy="Gadjit Prints is built around a focused set of original products that can be personalized through tasteful, controlled options."
    >
      <section className="about-layout">
        <div className="about-image reveal" aria-hidden="true">
          <ProductVisual variant={products[1].variant} tone={products[1].colors[0].swatch} />
          <ProductVisual variant={products[0].variant} tone={products[0].colors[0].swatch} />
          <ProductVisual variant={products[3].variant} tone={products[3].colors[2].swatch} />
        </div>
        <div className="about-copy reveal">
          <h2>Not a generic shop. Not an open-ended fabrication desk.</h2>
          <p>
            The studio designs a small collection first, then lets each piece be shaped through finish and configuration.
            That balance keeps the work intentional, repeatable, and still personal.
          </p>
          <p>
            Each product is treated like a designed object with boundaries: a defined form, a curated palette, and a set
            of options that make sense for how it will be used.
          </p>
          <div className="value-list">
            <span>Measured precision</span>
            <span>Material sensitivity</span>
            <span>Personal collaboration</span>
            <span>Small-batch attention</span>
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
  const [selectedColorName, setSelectedColorName] = useState(product.colors[0].name);
  const selectedColor = product.colors.find((color) => color.name === selectedColorName) ?? product.colors[0];
  const [selectedMaterial, setSelectedMaterial] = useState(selectedColor.materials[0]);

  useEffect(() => {
    if (!selectedColor.materials.includes(selectedMaterial)) {
      setSelectedMaterial(selectedColor.materials[0]);
    }
  }, [selectedColor, selectedMaterial]);

  return (
    <article className="catalog-card reveal">
      <div className="catalog-card-title">
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
          <span>{selectedColor.name} / {selectedMaterial}</span>
        </div>
      </div>
      <div className="catalog-options">
        <OptionGroup title="Color">
          <ColorSwatches
            colors={product.colors}
            selectedColor={selectedColorName}
            onSelectColor={setSelectedColorName}
          />
        </OptionGroup>
        <OptionGroup title="Material">
          <MaterialChoices
            available={selectedColor.materials}
            selectedMaterial={selectedMaterial}
            onSelectMaterial={setSelectedMaterial}
          />
        </OptionGroup>
      </div>
      <div className="catalog-tags">
        {product.config.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <NavLink className="configure-button" to={`/collection/${product.slug}`}>
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
  const [selectedColorName, setSelectedColorName] = useState(product.colors[0].name);
  const selectedColor = product.colors.find((color) => color.name === selectedColorName) ?? product.colors[0];
  const [selectedMaterial, setSelectedMaterial] = useState(selectedColor.materials[0]);
  const hasProductPhotos = product.imageUrls?.length > 0;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!selectedColor.materials.includes(selectedMaterial)) {
      setSelectedMaterial(selectedColor.materials[0]);
    }
  }, [selectedColor, selectedMaterial]);

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
                  <img src={imageUrl} alt="" loading="lazy" />
                </button>
              ))
            : [product.colors[0], product.colors[1], product.colors[2], selectedColor].filter(Boolean).map((color, index) => (
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
          <div className="detail-rating">
            <span>Studio configurable</span>
            <span>
              {[0, 1, 2, 3, 4].map((star) => (
                <Star key={star} size={15} fill="currentColor" />
              ))}
            </span>
          </div>
          <dl className="detail-spec-table">
            <div>
              <dt>Price</dt>
              <dd>{product.price}</dd>
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
          <a className="reference-link" href={product.sourceUrl} target="_blank" rel="noreferrer">
            View reference model <ArrowRight size={16} />
          </a>
        </section>
        <aside className="detail-buybox">
          <div className="buybox-price">
            <span>{product.price}</span>
            <small>Made after selection</small>
          </div>
          <OptionGroup title="Color">
            <ColorSwatches colors={product.colors} selectedColor={selectedColorName} onSelectColor={setSelectedColorName} />
          </OptionGroup>
          <OptionGroup title="Material">
            <MaterialChoices
              available={selectedColor.materials}
              selectedMaterial={selectedMaterial}
              onSelectMaterial={setSelectedMaterial}
            />
          </OptionGroup>
          <div className="buybox-selected">
            <strong>Current configuration</strong>
            <span>{selectedColor.name} / {selectedMaterial}</span>
          </div>
          <button className="button button-primary" type="button">
            Configure selection <ArrowRight size={17} />
          </button>
          <div className="buybox-notes">
            <span>
              <Truck size={16} />
              Local made-to-order production
            </span>
            <span>
              <Ruler size={16} />
              Configuration checked before printing
            </span>
            <span>
              <RotateCcw size={16} />
              Small adjustments confirmed by studio
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

function ProductMedia({ product, selectedColor, imageIndex = 0 }) {
  const imageUrl = product.imageUrls?.[imageIndex] ?? product.imageUrls?.[0];

  if (imageUrl) {
    return (
      <img
        className="product-photo"
        src={imageUrl}
        alt={`${product.title} sample print`}
        loading="lazy"
      />
    );
  }

  return <ProductVisual variant={product.variant} tone={selectedColor.swatch} />;
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
            <strong>{counts[option] ?? products.length}</strong>
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
          <span style={{ background: color.swatch }} />
          <small>{color.name}</small>
        </button>
      ))}
    </div>
  );
}

function MaterialChoices({ available, selectedMaterial, onSelectMaterial }) {
  return (
    <div className="material-choice-row">
      {Object.keys(materialInfo).map((material) => (
        <MaterialBadge
          key={material}
          material={material}
          selected={selectedMaterial === material}
          disabled={!available.includes(material)}
          onClick={() => available.includes(material) && onSelectMaterial(material)}
        />
      ))}
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
          {selectedColor.name} / {selectedMaterial}
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
      <div>
        <strong>Gadjit Prints</strong>
        <p>Five configurable 3D printed products, made to order in curated colors and finishes.</p>
      </div>
      <NavLink className="text-link" to="/collection">
        Browse products <ArrowRight size={17} />
      </NavLink>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
