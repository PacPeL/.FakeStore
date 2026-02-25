import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api.js";
import "../styles/catalog.scss";

// Drawer icons (mismos assets que usas en Home/Product)
import drawerIcon from "../assets/drawer_icon.svg";
import profileIcon from "../assets/iconamoon_profile-light.svg";
import cartIcon from "../assets/lineicons_cart-1.svg";
import searchIcon from "../assets/icon.svg";

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== SEARCH HEADER STATE / REFS =====
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // recent tags (mismo set que en Home/Product)
  const recentTags = [
    "Chuteira Adulto",
    "Chuteira Infantil",
    "Meião GMA",
    "Luva Goleiro",
    "Calça Térmica GMA",
    "Feminino",
    "Masculino",
  ];

  useEffect(() => {
    setLoading(true);
    api
      .getProducts()
      .then((data) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Si la ruta tiene q en query, precargarlo en el input (útil al volver)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = params.get("q") ?? "";
    setQ(qParam);
  }, [location.search]);

  // atajo de teclado Ctrl/Cmd + K y Escape
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
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
      if (e.target.closest(".drawer")) return; // dentro del drawer
      setSearchOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [searchOpen]);

  // enfocar input cuando se abre el header
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
        if (searchInputRef.current.select) searchInputRef.current.select();
      }, 80);
    }
  }, [searchOpen]);

  // navegar al catálogo con el query (cierra header)
  const goToCatalog = (query) => {
    const qParam = query ?? "";
    navigate(`/catalog?q=${encodeURIComponent(qParam)}`);
    setSearchOpen(false);
  };

  // manejar Enter en el input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      goToCatalog(q);
    }
  };

  // manejar click en tag: rellena input y navega automáticamente
  const handleTagClick = (tag) => {
    setQ(tag);
    // pequeña espera para que el estado se actualice (no estrictamente necesario)
    setTimeout(() => goToCatalog(tag), 0);
  };

  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);
  };

  if (loading) {
    return <div className="catalog__loading">Carregando catálogo...</div>;
  }

  return (
    <div className="catalog">
      {/* ===== SEARCH HEADER ===== */}
      <div className={`searchHeader ${searchOpen ? "isOpen" : ""}`}>
        <div className="searchHeader__bar">
          <img src={searchIcon} alt="" className="searchHeader__icon" />
          <input
            ref={searchInputRef}
            className="searchHeader__input"
            type="text"
            placeholder="Buscar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Buscar productos"
          />
        </div>

        <div className="searchHeader__section">
          <div className="searchHeader__title">Mais buscados</div>
        </div>

        <div className="searchHeader__tags">
          {recentTags.map((t) => (
            <button
              key={t}
              type="button"
              className="tag"
              onClick={() => handleTagClick(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TOP BAR / DRAWER (misma UX que Home/Product) ===== */}
      <header className="catalog__top">
        <div className="catalog__topInner">
          <h1 className="catalog__title">Catálogo de Produtos</h1>

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
      </header>

      {/* ===== GRID ===== */}
      <div className="catalog__grid">
        {products.map((p) => (
          <Link key={p.id} to={`/produto/${p.id}`} className="catalog__card">
            <img className="catalog__img" src={p.image} alt={p.title} />
            <div className="catalog__info">
              <div className="catalog__name">{p.title}</div>
              <div className="catalog__price">R$ {p.price.toFixed(2)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
