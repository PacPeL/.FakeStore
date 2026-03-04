import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api.js";
import { useStore } from "../store.jsx";
import { useAuthModal } from "../hooks/useAuthModal.js";
import AuthModal from "../components/AuthModal.jsx";
import "../styles/catalog.scss";
import "../styles/auth.scss";
import "../styles/logo.scss";
import "../styles/profile.scss"; // ✅ agregado

import home from "../assets/home.svg";

import drawerIcon  from "../assets/drawer_icon.svg";
import profileIcon from "../assets/iconamoon_profile-light.svg";
import cartIcon    from "../assets/lineicons_cart-1.svg";
import searchIcon  from "../assets/icon.svg";
import vectorArrow from "../assets/Vector.svg";
import logo  from "../assets/logo.svg";

// ✅ mismos icons que usas en Home/Cart para el perfil
import check from "../assets/check.svg";
import truck from "../assets/truck.svg";
import box from "../assets/box.svg";

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const { isLoggedIn, logout, authUser } = useStore();
  const auth = useAuthModal();

  const [q, setQ]                   = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef              = useRef(null);
  const navigate                    = useNavigate();
  const location                    = useLocation();

  const [filterOpen, setFilterOpen]     = useState(false);
  const [sortOpen, setSortOpen]         = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [sortBy, setSortBy]             = useState("Relevância");
  const filterRef                       = useRef(null);
  const sortRef                         = useRef(null);

  // ✅ PERFIL (agregado, igual al Home/Cart)
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileView, setProfileView] = useState("profile");
  const [ordersTab, setOrdersTab]     = useState("confirmed");

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email:    authUser?.email ?? "",
    phone:    "",
    cep:      "",
  });

  useEffect(() => {
    setProfileForm((prev) => ({ ...prev, email: authUser?.email ?? "" }));
  }, [authUser]);

  const openOrders = (tab) => { setOrdersTab(tab); setProfileView("orders"); };
  const closeProfileAll = () => { setProfileOpen(false); setProfileView("profile"); };

  const ordersByTab = {
    confirmed: [
      { id: "S1-29384756", title: "Chuteira Campo",    size: "41", qty: 1, img: "" },
      { id: "S1-11839201", title: "Meião GMA",         size: "U",  qty: 2, img: "" },
    ],
    preparing: [
      { id: "S1-77441122", title: "Luva Goleiro",      size: "M",  qty: 1, img: "" },
    ],
    shipping: [
      { id: "S1-99001122", title: "Calça Térmica GMA", size: "G",  qty: 1, img: "" },
    ],
  };

  const ordersTitle =
    ordersTab === "confirmed" ? "Pedidos Confirmados"
    : ordersTab === "preparing" ? "Pedidos Preparando"
    : "Pedidos A caminho";

  const ordersSub =
    ordersTab === "confirmed" ? "Confira seus pedidos já confirmados pela S1!"
    : ordersTab === "preparing" ? "Estamos preparando seus pedidos."
    : "Seus pedidos já estão a caminho!";

  const userName = authUser?.name || authUser?.email?.split("@")?.[0] || "";

  const handleSaveProfile = () => closeProfileAll();

  const handleLogoutFromProfile = async () => {
    closeProfileAll();
    await logout();
  };

  const recentTags = [
    "Chuteira", "Tênis", "Bola",
    "Luva", "Calça", "Shorts",
  ];

  useEffect(() => {
    setLoading(true);
    api.getProducts()
      .then(setProducts).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQ(params.get("q") ?? "");
  }, [location.search]);

  useEffect(() => {
    const handle = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false); setFilterOpen(false);
        setSortOpen(false); auth.closeAuth();
        setProfileOpen(false); // ✅ agregado
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [auth]);

  useEffect(() => {
    if (!searchOpen && !filterOpen && !sortOpen && !auth.authOpen && !profileOpen) return;
    const handle = (e) => {
      if (e.target.closest(".searchHeader")) return;
      if (e.target.closest(".drawer")) return;
      if (e.target.closest(".authModal")) return;
      if (e.target.closest(".profileModal")) return; // ✅ agregado

      if (searchOpen) setSearchOpen(false);
      if (auth.authOpen) auth.closeAuth();
      if (filterOpen && filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
      if (sortOpen   && sortRef.current   && !sortRef.current.contains(e.target))   setSortOpen(false);
      if (profileOpen) setProfileOpen(false); // ✅ agregado
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [searchOpen, filterOpen, sortOpen, auth, profileOpen]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 80);
  }, [searchOpen]);

  const goToCatalog = (query) => {
    navigate(`/catalog?q=${encodeURIComponent(query ?? "")}`);
    setSearchOpen(false);
  };

  // ✅ ARREGLO: antes deslogueaba. Ahora abre perfil si está logueado, si no abre login.
  const handleProfileClick = () => {
    if (isLoggedIn) setProfileOpen(true);
    else auth.openAuth("login");
  };

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["Todos", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    let arr = activeCategory !== "Todos"
      ? products.filter((p) => p.category === activeCategory)
      : products;
    if (qn) arr = arr.filter((p) => p.title.toLowerCase().includes(qn));
    return arr;
  }, [products, q, activeCategory]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "Menor preço": arr.sort((a, b) => a.price - b.price); break;
      case "Maior preço": arr.sort((a, b) => b.price - a.price); break;
      case "A-Z": arr.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "Z-A": arr.sort((a, b) => b.title.localeCompare(a.title)); break;
      default: break;
    }
    return arr;
  }, [filtered, sortBy]);

  const firstRow  = sorted.slice(0, 4);
  const restRows  = useMemo(() => {
    const rest = sorted.slice(4), out = [];
    for (let i = 0; i < rest.length; i += 4) out.push(rest.slice(i, i + 4));
    return out;
  }, [sorted]);

  if (loading) return <div className="catalog__loading">Carregando catálogo...</div>;

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
            onKeyDown={(e) => e.key === "Enter" && goToCatalog(q)}
            aria-label="Buscar produtos"
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
              onClick={() => { setQ(t); setTimeout(() => goToCatalog(t), 0); }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ===== AUTH MODAL ===== */}
      <AuthModal {...auth} />

      {/* ===== PROFILE MODAL (agregado) ===== */}
      <div className={`profileOverlay ${profileOpen ? "isOpen" : ""}`} onClick={closeProfileAll}>
        <div
          className={`profileModal ${profileOpen ? "isOpen" : ""}`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="profileCard">
            <div className="profileCard__pad">

              {/* ── VIEW: PROFILE ── */}
              {profileView === "profile" && (
                <div className="profileGrid">

                  {/* LEFT */}
                  <div className="profileLeft">
                    <div className="profileHello">
                      <div className="profileHello__text">
                        Olá, {userName || "[Nome do Usuário]"}.
                      </div>
                    </div>

                    <div className="profileFields">
                      <div className="profileField">
                        <input className="profileField__input"
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                          placeholder="Nome Completo: Ex. Goku Super Saiyajin 2"
                          aria-label="Nome completo" />
                      </div>
                      <div className="profileField">
                        <input className="profileField__input"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="E-mail: gokusupersaiyajin2@gmail.com"
                          aria-label="E-mail" />
                      </div>
                      <div className="profileField">
                        <input className="profileField__input"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="Número: Ex.(**) ****-****"
                          aria-label="Número" />
                      </div>
                      <div className="profileField">
                        <input className="profileField__input"
                          value={profileForm.cep}
                          onChange={(e) => setProfileForm((p) => ({ ...p, cep: e.target.value }))}
                          placeholder="Cep: Ex. *****-***"
                          aria-label="CEP" />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="profileRight">
                    <div className="profileRight__titleWrap">
                      <div className="profileRight__title">Minhas Compras</div>
                    </div>
                    <div className="profileRight__body">
                      <div className="profileIconsRow">
                        <button type="button" className="iconBox iconBox--confirmed iconBoxBtn"
                          onClick={() => openOrders("confirmed")}>
                          <img className="iconImg iconImg--confirmed" src={check} alt="Confirmado" />
                        </button>
                        <button type="button" className="iconBox iconBox--preparing iconBoxBtn"
                          onClick={() => openOrders("preparing")}>
                          <img className="iconImg iconImg--preparing" src={box} alt="Preparando" />
                        </button>
                        <button type="button" className="iconBox iconBox--shipping iconBoxBtn"
                          onClick={() => openOrders("shipping")}>
                          <img className="iconImg iconImg--shipping" src={truck} alt="A caminho" />
                        </button>
                      </div>
                      <div className="profileLabelsRow">
                        <div className="profileLabel">Confirmado</div>
                        <div className="profileLabel">Preparando</div>
                        <div className="profileLabel">A caminho</div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ── VIEW: ORDERS ── */}
              {profileView === "orders" && (
                <div className="ordersView">
                  <div className="ordersHead">
                    <div className="ordersHead__title">{ordersTitle}</div>
                    <div className="ordersHead__sub">{ordersSub}</div>
                  </div>
                  <div className="ordersList">
                    {ordersByTab[ordersTab].map((o) => (
                      <div key={o.id} className="orderItem">
                        <div className="orderItem__left">
                          <img className="orderItem__img"
                            src={o.img || "https://placehold.co/87x87"} alt="" />
                          <div className="orderItem__mid">
                            <div className="orderItem__name">{o.title}</div>
                            <div className="orderItem__meta">
                              <div className="orderItem__metaText">Tam {o.size}</div>
                              <div className="orderItem__metaText">Qnt. {o.qty}</div>
                            </div>
                          </div>
                          <div className="orderItem__codeWrap">
                            <div className="orderItem__code">Código do Pedido: #{o.id}</div>
                          </div>
                        </div>
                        <div className="orderItem__right">
                          <div className="orderRightIcon">
                            <div className="orderRightIcon__a" />
                            <div className="orderRightIcon__b" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* FOOTER BUTTONS */}
            <div className="profileActions">
              {profileView === "profile" ? (
                <>
                  {isLoggedIn ? (
                    <>
                      <button type="button" className="profileBtn profileBtn--ghost"
                        onClick={handleLogoutFromProfile}>
                        Sair
                      </button>
                      <button type="button" className="profileBtn profileBtn--solid"
                        onClick={handleSaveProfile}>
                        Salvar
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="profileBtn profileBtn--ghost"
                        onClick={closeProfileAll}>
                        Cancelar
                      </button>
                      <button type="button" className="profileBtn profileBtn--solid"
                        onClick={() => { closeProfileAll(); auth.openAuth("login"); }}>
                        Entrar
                      </button>
                    </>
                  )}
                </>
              ) : (
                <button type="button" className="profileBtn profileBtn--solid profileBtn--ok"
                  onClick={() => setProfileView("profile")}>
                  Ok
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ===== HERO ===== */}
      <section className="catalogHero">
        <div className="catalogHero__wrap">
          <img src={logo} alt="Logo" className="logo" />

          <nav className="drawer" aria-label="Ações rápidas">
            <Link className="drawer__btn" to="/" aria-label="Home">
              <img src={home} alt="" />
            </Link>

            <button
              className="drawer__btn"
              type="button"
              aria-label={isLoggedIn ? `Perfil (${authUser?.name ?? ""})` : "Entrar"}
              title={isLoggedIn
                ? `Ver perfil (${authUser?.name ?? authUser?.email ?? ""})`
                : "Entrar / Cadastrar"}
              onClick={handleProfileClick}
            >
              <img
                src={profileIcon}
                alt=""
                style={isLoggedIn ? { filter: "invert(35%) sepia(80%) saturate(400%) hue-rotate(100deg)" } : {}}
              />
            </button>

            <Link className="drawer__btn" to="/cart" aria-label="Carrinho">
              <img src={cartIcon} alt="" />
            </Link>

            <button
              className="drawer__btn"
              type="button"
              aria-label="Buscar"
              onClick={() => setSearchOpen((p) => !p)}
            >
              <img src={searchIcon} alt="" />
            </button>
          </nav>

          <div className="catalogHero__results">
            <div className="catalogHero__hint">Você buscou por "{q?.trim() ? q.trim() : "******"}"</div>
            <div className="catalogHero__count">{sorted.length} Resultados</div>
          </div>

          <div className="catalogControls">
            <div className="catalogControls__group" ref={filterRef}>
              <button
                type="button"
                className={`catalogControls__btn ${filterOpen ? "isOpen" : ""}`}
                onClick={() => { setFilterOpen((v) => !v); setSortOpen(false); auth.closeAuth(); }}
              >
                <span>Filtrar por</span>
                <img
                  src={vectorArrow}
                  alt=""
                  className={`catalogControls__arrow ${filterOpen ? "isOpen" : ""}`}
                />
              </button>

              {filterOpen && (
                <div className="catalogControls__menu">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`catalogControls__item ${activeCategory === c ? "isActive" : ""}`}
                      onClick={() => { setActiveCategory(c); setFilterOpen(false); }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="catalogControls__group" ref={sortRef}>
              <button
                type="button"
                className={`catalogControls__btn ${sortOpen ? "isOpen" : ""}`}
                onClick={() => { setSortOpen((v) => !v); setFilterOpen(false); auth.closeAuth(); }}
              >
                <span>Ordenar por</span>
                <img
                  src={vectorArrow}
                  alt=""
                  className={`catalogControls__arrow ${sortOpen ? "isOpen" : ""}`}
                />
              </button>

              {sortOpen && (
                <div className="catalogControls__menu">
                  {["Relevância", "Menor preço", "Maior preço", "A-Z", "Z-A"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`catalogControls__item ${sortBy === s ? "isActive" : ""}`}
                      onClick={() => { setSortBy(s); setSortOpen(false); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="catalogHero__row">
            {firstRow.map((p) => (
              <Link key={p.id} to={`/produto/${p.id}`} className="card">
                <img className="card__img" src={p.image} alt={p.title} loading="lazy" />

                <div className="card__text">
                  <div className="card__name">{p.title}</div>
                  <div className="card__price">R$ {p.price.toFixed(2)}</div>

                  <div className="card__stars" aria-label={`Avaliação ${p?.rating?.rate ?? 0} de 5`}>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const rate = Number(p?.rating?.rate ?? 0);
                      const isFilled = rate >= i + 1;
                      return (
                        <span
                          key={i}
                          className={`card__star ${isFilled ? "isFilled" : ""}`}
                          aria-hidden="true"
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
      </section>

      <section className="catalogBody">
        {restRows.map((row, idx) => (
          <div className="catalogBody__row" key={idx}>
            {row.map((p) => (
              <Link key={p.id} to={`/produto/${p.id}`} className="card">
                <img className="card__img" src={p.image} alt={p.title} loading="lazy" />

                <div className="card__text">
                  <div className="card__name">{p.title}</div>
                  <div className="card__price">R$ {p.price.toFixed(2)}</div>

                  <div className="card__stars" aria-label={`Avaliação ${p?.rating?.rate ?? 0} de 5`}>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const rate = Number(p?.rating?.rate ?? 0);
                      const isFilled = rate >= i + 1;
                      return (
                        <span
                          key={i}
                          className={`card__star ${isFilled ? "isFilled" : ""}`}
                          aria-hidden="true"
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
        ))}
      </section>

      <footer className="footerbar" />
    </div>
  );
}