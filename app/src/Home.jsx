import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./services/api";
import "./styles/home.scss";

import goldenBoots from "./assets/golden_boots.png";
import stadium from "./assets/stadium.png";

import drawerIcon from "./assets/drawer_icon.svg";
import profileIcon from "./assets/iconamoon_profile-light.svg";
import cartIcon from "./assets/lineicons_cart-1.svg";
import searchIcon from "./assets/icon.svg";

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // atajo de teclado Ctrl+K y Escape
  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  // cerrar al clickar fuera (pero no dentro del header ni del drawer)
  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e) => {
      if (e.target.closest(".searchHeader")) return; // dentro del header
      if (e.target.closest(".drawer")) return;       // dentro del drawer
      setSearchOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [searchOpen]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const prods = await api.getProducts();
      setItems(prods);
      setLoading(false);
    })().catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const qNorm = q.trim().toLowerCase();
    if (!qNorm) return items;
    return items.filter((p) => (p.title ?? "").toLowerCase().includes(qNorm));
  }, [items, q]);

  const gridItems = filtered.slice(0, 8);

  const goToNews = () => {
    document
      .getElementById("novidades")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);
  };

  return (
    <div className="home">
      {/* ===== SEARCH HEADER ===== */}
      <div className={`searchHeader ${searchOpen ? "isOpen" : ""}`}>
        <div className="searchHeader__bar">
          <img src={searchIcon} alt="" className="searchHeader__icon" />
          <input
            className="searchHeader__input"
            type="text"
            placeholder="Buscar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus={searchOpen}
          />
        </div>

        <div className="searchHeader__section">
          <div className="searchHeader__title">Mais buscados</div>
        </div>

        <div className="searchHeader__tags">
          <span className="tag">Chuteira Adulto</span>
          <span className="tag">Chuteira Infantil</span>
          <span className="tag">Meião GMA</span>
          <span className="tag">Luva Goleiro</span>
          <span className="tag">Calça Térmica GMA</span>
          <span className="tag">Feminino</span>
          <span className="tag">Masculino</span>
        </div>
      </div>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero__wrap">
          <div className="hero__brand">po</div>

          <div className="hero__copy">
            <h1 className="hero__title">
              GMA D’or <br />
              Chuteira Campo
            </h1>
            <p className="hero__desc">
              Poucos pares. Acabamento dourado exclusivo. Performance de elite. Uma
              chuteira feita para brilhar e marcar presença dentro e fora dos gramados.
            </p>
          </div>

          <button className="hero__cta" type="button" onClick={goToNews}>
            Ler mais
          </button>

          <div className="hero__media">
            <img src={goldenBoots} alt="GMA D’or Chuteira Campo" />
          </div>

          {/* ===== Drawer vertical ===== */}
          <nav className="drawer" aria-label="Ações rápidas">
            <button className="drawer__btn" type="button" aria-label="Menu">
              <img src={drawerIcon} alt="" />
            </button>

            <button className="drawer__btn" type="button" aria-label="Perfil">
              <img src={profileIcon} alt="" />
            </button>

            <Link className="drawer__btn" to="/cart" aria-label="Carrinho">
              <img src={cartIcon} alt="" />
            </Link>

            {/* LUPA: toggle header */}
            <button
              className="drawer__btn"
              type="button"
              aria-label="Buscar"
              onClick={toggleSearch}
            >
              <img src={searchIcon} alt="" />
            </button>
          </nav>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className="benefits">
        <div className="benefits__row">
          <div className="benefits__item">
            <strong>FRETE GRÁTIS</strong> para compras acima de <strong>R$ 200!</strong>
          </div>
          <div className="benefits__item">
            <strong>Envio rápido</strong> para todo o <strong>Brasil!</strong>
          </div>
          <div className="benefits__item">
            <strong>20% OFF</strong> na sua primeira <strong>compra!</strong>
          </div>
        </div>
      </section>

      {/* ===== NOVIDADES HEAD ===== */}
      <section className="newsHead" id="novidades">
        <h2 className="newsHead__title">Novidades</h2>
        <p className="newsHead__sub">Confira já!</p>
      </section>

      {/* ===== GRID ===== */}
      <section className="grid">
        {loading ? (
          <div className="grid__loading">Carregando produtos...</div>
        ) : (
          <div className="grid__rows">
            <div className="grid__row">
              {gridItems.slice(0, 4).map((p) => (
                <Link key={p.id} to={`/produto/${p.id}`} className="card">
                  <img className="card__img" src={p.image} alt={p.title} loading="lazy" />
                  <div className="card__text">
                    <div className="card__name">{p.title}</div>
                    <div className="card__price">R$ {p.price.toFixed(2)}</div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="grid__row">
              {gridItems.slice(4, 8).map((p) => (
                <Link key={p.id} to={`/produto/${p.id}`} className="card">
                  <img className="card__img" src={p.image} alt={p.title} loading="lazy" />
                  <div className="card__text">
                    <div className="card__name">{p.title}</div>
                    <div className="card__price">R$ {p.price.toFixed(2)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===== BANNER ===== */}
      <section className="banner">
        <img src={stadium} alt="Torcida no estádio" />
      </section>

      <footer className="footerbar" />
    </div>
  );
}
