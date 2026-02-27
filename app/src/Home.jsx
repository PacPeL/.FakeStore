import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./services/api";
import "./styles/home.scss";
import "./styles/auth.scss";

import goldenBoots from "./assets/golden_boots.png";
import stadium from "./assets/stadium.png";

import drawerIcon from "./assets/drawer_icon.svg";
import profileIcon from "./assets/iconamoon_profile-light.svg";
import cartIcon from "./assets/lineicons_cart-1.svg";
import searchIcon from "./assets/icon.svg";
import googleIcon from "./assets/icon_google.svg"; 


export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const searchInputRef = useRef(null);
  const navigate = useNavigate();








  // ✅ modal login/register
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login"); // "login" | "register"
  const authRef = useRef(null);

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");







  // atajo de teclado Ctrl+K y Escape
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setAuthOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  // cerrar al clickar fuera (pero no dentro del header ni del drawer ni del modal)
  useEffect(() => {
    if (!searchOpen && !authOpen) return;

    const handleClickOutside = (e) => {
      if (e.target.closest(".searchHeader")) return;
      if (e.target.closest(".drawer")) return;
      if (e.target.closest(".authModal")) return;

      if (authOpen) setAuthOpen(false);
      if (searchOpen) setSearchOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [searchOpen, authOpen]);

  // enfocar input cuando se abre el header
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
        if (searchInputRef.current.select) searchInputRef.current.select();
      }, 80);
    }
  }, [searchOpen]);

  // enfocar email cuando abre modal
  useEffect(() => {
    if (!authOpen) return;
    setTimeout(() => {
      const el = authRef.current?.querySelector("input");
      if (el) el.focus();
    }, 220);
  }, [authOpen, authTab]);

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

  const toggleSearch = () => setSearchOpen((prev) => !prev);

  const goToCatalog = (query) => {
    const qParam = query ?? "";
    navigate(`/catalog?q=${encodeURIComponent(qParam)}`);
    setSearchOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") goToCatalog(q);
  };

  const handleTagClick = (tag) => {
    setQ(tag);
    setTimeout(() => goToCatalog(tag), 0);
  };

  const recentTags = [
    "Chuteira Adulto",
    "Chuteira Infantil",
    "Meião GMA",
    "Luva Goleiro",
    "Calça Térmica GMA",
    "Feminino",
    "Masculino",
  ];

  // open auth modal
  const openAuth = (tab = "login") => {
    setAuthTab(tab);
    setAuthOpen(true);
    setSearchOpen(false);
  };

  // placeholder submit
  const handleSubmitAuth = (e) => {
    e.preventDefault();

    // if (authTab === "register" && password !== confirmPassword) {
    //   // TODO mostrar toast/erro
    //   return;
    // }

    // if (authTab === "login") {
    //   // TODO Firebase signInWithEmailAndPassword(auth, email, password)
    // } else {
    //   // TODO Firebase createUserWithEmailAndPassword(auth, email, password)
    // }

    alert(
      authTab === "login"
        ? `Login: ${email}`
        : `Cadastrar: ${email}`
    );
  };

  return (
    <div className="home">
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






























{/* ✅ AUTH MODAL (Figma) */}
<div
  className={`authOverlay ${authOpen ? "isOpen" : ""}`}
  aria-hidden={!authOpen}
>
  <div
    className={`authModal ${authOpen ? "isOpen" : ""}`}
    role="dialog"
    aria-modal="true"
    aria-label="Login / Cadastrar"
    ref={authRef}
  >
    {/* tabs */}
    <div className="authTabs">
      <button
        type="button"
        className={`authTab ${authTab === "login" ? "isActive" : ""}`}
        onClick={() => setAuthTab("login")}
      >
        Login
      </button>

      <button
        type="button"
        className={`authTab ${authTab === "register" ? "isActive" : ""}`}
        onClick={() => setAuthTab("register")}
      >
        Cadastrar
      </button>
    </div>

    {/* underline gradient */}
    <div className="authUnderlineWrap">
      <div
        className={`authUnderline ${
          authTab === "register" ? "isRegister" : "isLogin"
        }`}
      />
    </div>

    {/* form */}
    <form
      className={`authForm ${authTab === "register" ? "isRegister" : ""}`}
      onSubmit={handleSubmitAuth}
    >
      <div className="authForm__inner">
        {/* Email */}
        <div className="authGroup">
          <div className="authLabel">E-mail</div>
          <div className="authInputBox">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digitar..."
              aria-label="E-mail"
            />
          </div>
        </div>

        {/* Senha */}
        <div className="authGroup">
          <div className="authLabel">Senha</div>
          <div className="authInputBox">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="**********"
              aria-label="Senha"
            />
          </div>
        </div>

        {/* ✅ Login: link "Esqueci minha senha." */}
        {authTab === "login" && (
          <div className="authForgotWrap">
            <button
              type="button"
              className="authForgot"
              onClick={() => {
                // TODO: fluxo de reset (cuando haya backend)
              }}
            >
              Esqueci minha senha.
            </button>
          </div>
        )}

        {/* Confirmar Senha (solo register) */}
        {authTab === "register" && (
          <div className="authGroup">
            <div className="authLabel">Confirmar Senha</div>
            <div className="authInputBox">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="**********"
                aria-label="Confirmar Senha"
              />
            </div>
          </div>
        )}
      </div>

      {/* ✅ Footer (Google + submit) */}
      <div
        className={`authFooter ${
          authTab === "login" ? "isLogin" : "isRegister"
        }`}
      >
        {/* ✅ Google (ambos tabs, sin backend todavía) */}
        <button
          type="button"
          className="authGoogleBtn"
          onClick={() => {
            // TODO: Google auth (cuando haya backend)
          }}
        >
          <img className="authGoogleBtn__icon" src={googleIcon} alt="" />
          <span>
            {authTab === "login" ? "Entrar com Google" : "Cadastrar com Google"}
          </span>
        </button>

        {/* ✅ submit principal */}
        <button className="authSubmit" type="submit">
          {authTab === "login" ? "Entrar" : "Criar Conta"}
        </button>
      </div>
    </form>
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

            <button
              className="drawer__btn"
              type="button"
              aria-label="Perfil"
              onClick={() => openAuth("login")}
            >
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
              <div className="card__nameWrap">
                <div className="card__name">{p.title}</div>
              </div>

              <div className="card__price">R$ {p.price.toFixed(2)}</div>



              {/* Figma: fila con 5 “íconos” */}
              <div className="card__icons">
                {Array.from({ length: 5 }).map((_, i) => {
                  const rating = Math.round(p.rating?.rate || 0);
                  return (
                    <span
                      key={i}
                      className={`card__star ${i < rating ? "isFilled" : ""}`}
                    >
                      ★
                    </span>
                  );
                })}
              </div>


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