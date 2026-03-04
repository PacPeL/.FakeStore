import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useMemo } from "react";
import { useStore } from "../store.jsx";
import { useAuthModal } from "../hooks/useAuthModal.js";
import AuthModal from "../components/AuthModal.jsx";
import "../styles/cart.scss";
import "../styles/auth.scss";
import "../styles/logo.scss";
import "../styles/profile.scss"; // ✅ agregado (para reutilizar tu modal de perfil)

import home from "../assets/home.svg";

import drawerIcon  from "../assets/drawer_icon.svg";
import profileIcon from "../assets/iconamoon_profile-light.svg";
import cartIcon    from "../assets/lineicons_cart-1.svg";
import searchIcon  from "../assets/icon.svg";
import logo  from "../assets/logo.svg";

import qr  from "../assets/qr.png";
import pix  from "../assets/pix.svg";
import debit  from "../assets/debit.svg";
import copy  from "../assets/copy.svg";
import x  from "../assets/x.svg";
import like  from "../assets/like.gif";

// ✅ mismos icons que usas en Home para el perfil
import check from "../assets/check.svg";
import truck from "../assets/truck.svg";
import box from "../assets/box.svg";

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

  // ✅ PERFIL (agregado, igual al Home)
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
      if (e.key === "Escape") {
        setSearchOpen(false);
        auth.closeAuth();
        setProfileOpen(false); // ✅ agregado
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [auth]);

  useEffect(() => {
    if (!searchOpen && !auth.authOpen && !profileOpen) return;
    const handle = (e) => {
      if (e.target.closest(".searchHeader")) return;
      if (e.target.closest(".drawer")) return;
      if (e.target.closest(".authModal")) return;
      if (e.target.closest(".profileModal")) return; // ✅ agregado
      if (auth.authOpen) auth.closeAuth();
      if (searchOpen) setSearchOpen(false);
      if (profileOpen) setProfileOpen(false); // ✅ agregado
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [searchOpen, auth, profileOpen]);

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

  const handleSaveProfile = () => closeProfileAll();

  const handleLogoutFromProfile = async () => {
    closeProfileAll();
    await logout();
  };

  // ✅ Total real (price * qty) pro TOTAL final
  const totalReal = useMemo(() => {
    return cart.reduce((acc, x) => {
      const price = Number(x.price) || 0;
      const qty = Number(x.qty) || 0;
      return acc + price * qty;
    }, 0);
  }, [cart]);

  const totalToShow = Number.isFinite(cartTotal) && cartTotal >= 0 ? cartTotal : totalReal;

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

      {/* ===== PROFILE MODAL (agregado, igual al Home) ===== */}
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

            <button
              className="drawer__btn"
              type="button"
              aria-label="Buscar"
              onClick={() => setSearchOpen((p) => !p)}
            >
              <img src={searchIcon} alt="" />
            </button>
          </nav>

          {/* ✅ TÍTULO CENTRAL */}
          <div className="cartTitle" aria-label="Título do carrinho">
            <div className="cartTitle__text">Meu Carrinho</div>
            <img className="cartTitle__icon" src={cartIcon} alt="" aria-hidden="true" />
          </div>

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
                    <div key={`${x.id}-${x.size ?? "nosize"}`} className="cartItem">
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

                        {/* precio del item en la lista: TOTAL por producto */}
                        <div className="cartItem__price">
                          <span className="pPrice__pixRS">R$</span>
                          {(Number(x.price || 0) * Number(x.qty || 0)).toFixed(2)}
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

                    <div className="cartSummary__items">
                      {cart.map((x) => (
                        <div className="cartSummary__itemRow" key={`sum-${x.id}-${x.size ?? "nosize"}`}>
                          <div className="cartSummary__itemQty">Items ({Number(x.qty) || 0})</div>

                          <div className="cartSummary__itemPrice">
                            R$ {(Number(x.price) || 0).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="cartSummary__right">
                    <div className="cartSummary__value">R$ {totalToShow.toFixed(2)}</div>
                  </div>
                </div>

                <div className="cartSummary__divider" />

                <div className="cartSummary__body">
                  <div className="cartSummary__totalRow">
                    <div className="cartSummary__label">Total</div>
                    <div className="cartSummary__totalValue">
                      <span className="cartSummary__currency">R$</span>
                      <span className="cartSummary__totalUnderline">{totalToShow.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    className="cartSummary__checkout"
                    type="button"
                    onClick={() => { clearCart(); }}
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