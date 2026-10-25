import { Route, Routes } from 'react-router';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { RegisterPage } from './pages/RegisterPage';

/** Root layout: header, the routed page, footer. */
export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ThemePreview />} />
      </Routes>
      <Footer />
    </div>
  );
}

/** Temporary `/` content until the inventory page replaces it. */
function ThemePreview() {
  return (
    <>
      <div className="module-strip">
        <span>///INVENTORY.MODULE</span>
        <span>
          theme preview<span className="animate-blink">_</span>
        </span>
      </div>

      <main className="flex-1 px-4 md:px-8 py-10 space-y-10">
        <h1 className="glitch text-5xl text-black" data-text="Rayfield Autoshow">
          Rayfield Autoshow
        </h1>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
          <article className="cyber-panel">
            <div className="cyber-screen h-36 font-mono text-cp-yellow/60">[ SUV ]</div>
            <div className="p-5 space-y-3">
              <p className="text-sm uppercase tracking-[2px] text-cp-muted">Toyota · 2024</p>
              <h2 className="text-2xl font-bold uppercase">Land Cruiser</h2>
              <div className="flex gap-2">
                <span className="cyber-badge">
                  <span className="cyber-badge-label">Category</span>
                  <span className="cyber-badge-value">SUV</span>
                </span>
                <span className="cyber-badge">
                  <span className="cyber-badge-label">Stock</span>
                  <span className="cyber-badge-value is-cyan">02</span>
                </span>
              </div>
              <p className="font-mono text-xl">$125,000.00</p>
              <button className="btn-cyber" data-text="PURCHASE_">
                PURCHASE_
              </button>
            </div>
          </article>

          <article className="cyber-panel">
            <div className="cyber-screen h-36 font-mono text-cp-yellow/60">[ COUPE ]</div>
            <div className="p-5 space-y-3">
              <p className="text-sm uppercase tracking-[2px] text-cp-muted">Porsche · 2025</p>
              <h2 className="text-2xl font-bold uppercase">911 Carrera</h2>
              <span className="cyber-badge">
                <span className="cyber-badge-label">Stock</span>
                <span className="cyber-badge-value is-red">Sold out</span>
              </span>
              <p className="font-mono text-xl">$120,000.00</p>
              <button className="btn-cyber" data-text="PURCHASE_" disabled>
                PURCHASE_
              </button>
            </div>
          </article>

          <form className="cyber-panel p-5 space-y-4">
            <div>
              <label className="cyber-label" htmlFor="preview-make">
                Make
              </label>
              <input id="preview-make" className="cyber-input" placeholder="Toyota" />
            </div>
            <div>
              <label className="cyber-label" htmlFor="preview-price">
                Price
              </label>
              <input id="preview-price" className="cyber-input" aria-invalid="true" />
              <p className="cyber-error">
                Price must be between $0.01 and $100,000,000, with up to 2 decimals
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" className="btn-ghost">
                Clear
              </button>
              <button type="button" className="btn-danger">
                Delete
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
