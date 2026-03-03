import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useMemo } from "react";
import { useStore } from "../store.jsx";
import { useAuthModal } from "../hooks/useAuthModal.js";
import AuthModal from "../components/AuthModal.jsx";
import "../styles/cart.scss";
import "../styles/auth.scss";
import "../styles/logo.scss";

import home from "../assets/home.svg";

import drawerIcon  from "../assets/drawer_icon.svg";
import profileIcon from "../assets/iconamoon_profile-light.svg";
import cartIcon    from "../assets/lineicons_cart-1.svg";
import searchIcon  from "../assets/icon.svg";
import logo  from "../assets/logo.svg";

export default function Cart() {
  const {
    state,
    removeFromCart,
    setQty,
    clearCart,
    cartTotal,
    setSize,
    isLoggedIn,
    logout,
    authUser
  } = useStore();

  const auth = useAuthModal();
  const cart = state.cart;

  const [toast, setToast]           = useState("");
  const [q, setQ]                   = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef              = useRef(null);
  const navigate                    = useNavigate();

  const recentTags = [
    "Chuteira", "Tênis", "Bola",
    "Luva", "Calça", "Shorts",
  ];

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  useEffect(() => {
    const handle = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setSearchOpen(true);
      }
      if (e.key === "Escape") { setSearchOpen(false); auth.closeAuth(); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [auth]);

  useEffect(() => {
    if (!searchOpen && !auth.authOpen) return;
    const handle = (e) => {
      if (e.target.closest(".searchHeader")) return;
      if (e.target.closest(".drawer")) return;
      if (e.target.closest(".authModal")) return;
      if (auth.authOpen) auth.closeAuth();
      if (searchOpen) setSearchOpen(false);
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [searchOpen, auth]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 80);
  }, [searchOpen]);

  const goToCatalog = (query) => {
    navigate(`/catalog?q=${encodeURIComponent(query ?? "")}`);
    setSearchOpen(false);
  };

  const handleProfileClick = () => {
    if (isLoggedIn) logout();
    else auth.openAuth("login");
  };

  // ✅ Total de itens (suma qty) para “X Item(s)” como en Figma
  const itemsCount = useMemo(() => {
    return cart.reduce((acc, x) => acc + (Number(x.qty) || 0), 0);
  }, [cart]);

  return (
    <div className="cart">

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

      {/* ===== HERO ===== */}
      <section className="cartHero">
        <img src={logo} alt="Logo" className="logo" />

        <div className="cartHero__wrap">

          <nav className="drawer" aria-label="Ações rápidas">
            <Link className="drawer__btn" to="/" aria-label="Home">
              <img src={home} alt="" />
            </Link>

            <button
              className="drawer__btn"
              type="button"
              aria-label={isLoggedIn ? "Sair" : "Entrar"}
              title={isLoggedIn ? `Clique para sair (${authUser?.name ?? authUser?.email ?? ""})` : "Entrar / Cadastrar"}
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

          {!cart.length ? (
            <div className="cartEmpty">
              <div className="cartEmpty__text">Seu carrinho está vazio.</div>
              <Link className="cartEmpty__btn" to="/">Ver produtos</Link>
            </div>
          ) : (
            <div className="cartLayout">
              <div className="cartList">
                {cart.map((x) => {
                  const sizes = x.sizes ?? [];
                  return (
                    <div key={`${x.id}-${x.size}`} className="cartItem">
                      <div className="cartItem__inner">
                        <img className="cartItem__img" src={x.image} alt={x.title} />

                        <div className="cartItem__info">
                          <div className="cartItem__name">{x.title}</div>

                          <div className="cartItem__controls">
                            {sizes.length > 0 && (
                              <select
                                className="cartItem__size"
                                value={x.size ?? ""}
                                onChange={(e) => setSize(x.id, x.size, e.target.value)}
                                aria-label="Selecionar tamanho"
                              >
                                {sizes.map((n) => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                            )}

                            <div className="cartItem__qty">
                              <button
                                className="cartItem__qtyBtn"
                                onClick={() => {
                                  const newQty = (x.qty ?? 0) - 1;
                                  if (newQty <= 0) removeFromCart(x.id, x.size);
                                  else setQty(x.id, x.size, newQty);
                                }}
                                aria-label="Diminuir quantidade"
                              >
                                -
                              </button>

                              <span className="cartItem__qtyVal">{x.qty}</span>

                              <button
                                className="cartItem__qtyBtn"
                                onClick={() => setQty(x.id, x.size, (x.qty ?? 0) + 1)}
                                aria-label="Aumentar quantidade"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="cartItem__price">
                          R$ {(x.price * x.qty).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <aside className="cartSummary">
                <div className="cartSummary__top">
                  <div className="cartSummary__left">
                    <div className="cartSummary__title">Resumo</div>

                    {/* ✅ como Figma: solo 1 línea "X Item(s)" */}
                    <div className="cartSummary__itemRow">
                      <div className="cartSummary__itemQty">{itemsCount} Item(s)</div>
                      <div className="cartSummary__itemPrice">R$ {cartTotal.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="cartSummary__right">
                    <div className="cartSummary__value">R$ {cartTotal.toFixed(2)}</div>
                  </div>
                </div>

                <div className="cartSummary__divider" />

                <div className="cartSummary__body">
                  <div className="cartSummary__totalRow">
                    <div className="cartSummary__label">Total</div>
                    <div className="cartSummary__totalValue">
                      <span className="cartSummary__currency">R$</span>
                      <span className="cartSummary__totalUnderline">{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    className="cartSummary__checkout"
                    type="button"
                    onClick={() => { showToast("Compra realizada com sucesso!"); clearCart(); }}
                  >
                    Finalizar compra
                  </button>
                </div>
              </aside>
            </div>
          )}

          {toast && <div className="cart__toast">{toast}</div>}
        </div>
      </section>

      <footer className="footerbar" />
    </div>
  );
}