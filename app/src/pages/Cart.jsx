import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useMemo } from "react";
import { useStore } from "../store.jsx";
import { useAuthModal } from "../hooks/useAuthModal.js";
import AuthModal from "../components/AuthModal.jsx";
import "../styles/cart.scss";
import "../styles/auth.scss";
import "../styles/logo.scss";
import "../styles/profile.scss";
import "../styles/purchase.scss"; // ✅ NECESARIO (buy modal + pay ok)

import home from "../assets/home.svg";

import drawerIcon from "../assets/drawer_icon.svg";
import profileIcon from "../assets/iconamoon_profile-light.svg";
import cartIcon from "../assets/lineicons_cart-1.svg";
import searchIcon from "../assets/icon.svg";
import logo from "../assets/logo.svg";

import qr from "../assets/qr.png";
import pix from "../assets/pix.svg";
import debit from "../assets/debit.svg";
import copy from "../assets/copy.svg";
import x from "../assets/x.svg";
import like from "../assets/like.gif";

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
    authUser,
  } = useStore();

  const auth = useAuthModal();
  const cart = state.cart;

  const [toast, setToast] = useState("");
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // ✅ PERFIL
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileView, setProfileView] = useState("profile");
  const [ordersTab, setOrdersTab] = useState("confirmed");

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: authUser?.email ?? "",
    phone: "",
    cep: "",
  });

  useEffect(() => {
    setProfileForm((prev) => ({ ...prev, email: authUser?.email ?? "" }));
  }, [authUser]);

  const openOrders = (tab) => {
    setOrdersTab(tab);
    setProfileView("orders");
  };
  const closeProfileAll = () => {
    setProfileOpen(false);
    setProfileView("profile");
  };


  const ordersByTab = {
    confirmed: [
      { id: "S1-29384756", title: "Chuteira Campo", size: "41", qty: 1, img: "" },
      { id: "S1-11839201", title: "Meião GMA", size: "U", qty: 2, img: "" },
    ],
    preparing: [{ id: "S1-77441122", title: "Luva Goleiro", size: "M", qty: 1, img: "" }],
    shipping: [{ id: "S1-99001122", title: "Calça Térmica GMA", size: "G", qty: 1, img: "" }],
  };

  const ordersTitle =
    ordersTab === "confirmed"
      ? "Pedidos Confirmados"
      : ordersTab === "preparing"
      ? "Pedidos Preparando"
      : "Pedidos A caminho";

  const ordersSub =
    ordersTab === "confirmed"
      ? "Confira seus pedidos já confirmados pela S1!"
      : ordersTab === "preparing"
      ? "Estamos preparando seus pedidos."
      : "Seus pedidos já estão a caminho!";

  const userName = authUser?.name || authUser?.email?.split("@")?.[0] || "";

  const recentTags = ["Chuteira", "Tênis", "Bola", "Luva", "Calça", "Shorts"];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  // ✅ Total real (price * qty)
  const totalReal = useMemo(() => {
    return cart.reduce((acc, x) => {
      const price = Number(x.price) || 0;
      const qty = Number(x.qty) || 0;
      return acc + price * qty;
    }, 0);
  }, [cart]);

  const totalToShow = Number.isFinite(cartTotal) && cartTotal >= 0 ? cartTotal : totalReal;

  // ==========================
  // ✅ BUY MODAL + PAY OK (LA LÓGICA QUE TE FALTABA)
  // ==========================
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyStep, setBuyStep] = useState(1);
  const [payMethod, setPayMethod] = useState("pix");
  const [pixSecondsLeft, setPixSecondsLeft] = useState(180);

  const [buyForm, setBuyForm] = useState({
    fullName: "",
    cpf: "",
    cep: "",
    state: "",
    city: "",
    neighborhood: "",
    street: "",
    number: "",
    cardName: "",
    cardNumber: "",
    cardExp: "",
    cardCvv: "",
  });

  const orderNumber = useMemo(() => {
    const n = Math.floor(1000000 + Math.random() * 9000000);
    return String(n);
  }, [buyOpen]);

  const pixCode = useMemo(() => "r462a2-1k6t62-28j58r-27e37b", []);

  const [payOkOpen, setPayOkOpen] = useState(false);

  const closePayOk = () => setPayOkOpen(false);

  const closeBuyAll = () => {
    setBuyOpen(false);
    setBuyStep(1);
    setPayMethod("pix");
    setPixSecondsLeft(180);
  };

const openBuy = () => {
  if (!isLoggedIn) {
    window.alert("Você precisa estar logado para comprar.");
    auth.openAuth("login");
    return;
  }

  // ✅ abre en el siguiente tick para evitar "click abre + click cierra"
  setTimeout(() => {
    setBuyOpen(true);
    setBuyStep(1);
    setPayMethod("pix");
    setPixSecondsLeft(180);
  }, 0);
};

  const goNextBuyStep = () => setBuyStep(2);

  useEffect(() => {
    if (!buyOpen) return;
    if (buyStep !== 2) return;
    if (payMethod !== "pix") return;

    const t = setInterval(() => {
      setPixSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(t);
  }, [buyOpen, buyStep, payMethod]);

  const formatMMSS = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      window.alert("Código PIX copiado!");
    } catch {
      window.alert("Não foi possível copiar automaticamente. Copie manualmente.");
    }
  };

  const finishPurchase = () => {
    // ✅ simula compra concluída
    closeBuyAll();
    clearCart();
    setPayOkOpen(true);
  };
  // ==========================
  // END BUY MODAL + PAY OK
  // ==========================

  useEffect(() => {
    const handle = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        auth.closeAuth();
        setProfileOpen(false);
        if (buyOpen) closeBuyAll();
        if (payOkOpen) closePayOk();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [auth, buyOpen, payOkOpen]);

  // ✅ click fuera (con guard para no cerrar al clickear checkout)
  useEffect(() => {
    if (!searchOpen && !auth.authOpen && !profileOpen && !buyOpen && !payOkOpen) return;

    const handle = (e) => {
      if (buyOpen) return;

      if (e.target.closest(".searchHeader")) return;
      if (e.target.closest(".drawer")) return;
      if (e.target.closest(".authModal")) return;
      if (e.target.closest(".profileModal")) return;
      if (e.target.closest(".buyModal")) return;
      if (e.target.closest(".payModal")) return;

      // ✅ ESTE es el que te evita el "abre y se cierra"
      if (e.target.closest(".cartSummary__checkout")) return;

      if (auth.authOpen) auth.closeAuth();
      if (searchOpen) setSearchOpen(false);
      if (profileOpen) setProfileOpen(false);
      if (payOkOpen) closePayOk();
    };

    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [searchOpen, auth, profileOpen, buyOpen, payOkOpen]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 80);
  }, [searchOpen]);

  const goToCatalog = (query) => {
    navigate(`/catalog?q=${encodeURIComponent(query ?? "")}`);
    setSearchOpen(false);
  };

  const handleProfileClick = () => {
    if (isLoggedIn) setProfileOpen(true);
    else auth.openAuth("login");
  };

  const handleSaveProfile = () => closeProfileAll();

  const handleLogoutFromProfile = async () => {
    closeProfileAll();
    await logout();
  };

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
              onClick={() => {
                setQ(t);
                setTimeout(() => goToCatalog(t), 0);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ===== AUTH MODAL ===== */}
      <AuthModal {...auth} />

      {/* ===== PROFILE MODAL ===== */}
      <div className={`profileOverlay ${profileOpen ? "isOpen" : ""}`} onClick={closeProfileAll}>
        <div
          className={`profileModal ${profileOpen ? "isOpen" : ""}`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="profileCard">
            <div className="profileCard__pad">
              {profileView === "profile" && (
                <div className="profileGrid">
                  <div className="profileLeft">
                    <div className="profileHello">
                      <div className="profileHello__text">Olá, {userName || "[Nome do Usuário]"}.</div>
                    </div>

                    <div className="profileFields">
                      <div className="profileField">
                        <input
                          className="profileField__input"
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                          placeholder="Nome Completo: Ex. Goku Super Saiyajin 2"
                          aria-label="Nome completo"
                        />
                      </div>
                      <div className="profileField">
                        <input
                          className="profileField__input"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="E-mail: gokusupersaiyajin2@gmail.com"
                          aria-label="E-mail"
                        />
                      </div>
                      <div className="profileField">
                        <input
                          className="profileField__input"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="Número: Ex.(**) ****-****"
                          aria-label="Número"
                        />
                      </div>
                      <div className="profileField">
                        <input
                          className="profileField__input"
                          value={profileForm.cep}
                          onChange={(e) => setProfileForm((p) => ({ ...p, cep: e.target.value }))}
                          placeholder="Cep: Ex. *****-***"
                          aria-label="CEP"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="profileRight">
                    <div className="profileRight__titleWrap">
                      <div className="profileRight__title">Minhas Compras</div>
                    </div>
                    <div className="profileRight__body">
                      <div className="profileIconsRow">
                        <button type="button" className="iconBox iconBox--confirmed iconBoxBtn" onClick={() => openOrders("confirmed")}>
                          <img className="iconImg iconImg--confirmed" src={check} alt="Confirmado" />
                        </button>
                        <button type="button" className="iconBox iconBox--preparing iconBoxBtn" onClick={() => openOrders("preparing")}>
                          <img className="iconImg iconImg--preparing" src={box} alt="Preparando" />
                        </button>
                        <button type="button" className="iconBox iconBox--shipping iconBoxBtn" onClick={() => openOrders("shipping")}>
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
                          <img className="orderItem__img" src={o.img || "https://placehold.co/87x87"} alt="" />
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

            <div className="profileActions">
              {profileView === "profile" ? (
                <>
                  {isLoggedIn ? (
                    <>
                      <button type="button" className="profileBtn profileBtn--ghost" onClick={handleLogoutFromProfile}>
                        Sair
                      </button>
                      <button type="button" className="profileBtn profileBtn--solid" onClick={handleSaveProfile}>
                        Salvar
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="profileBtn profileBtn--ghost" onClick={closeProfileAll}>
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="profileBtn profileBtn--solid"
                        onClick={() => {
                          closeProfileAll();
                          auth.openAuth("login");
                        }}
                      >
                        Entrar
                      </button>
                    </>
                  )}
                </>
              ) : (
                <button type="button" className="profileBtn profileBtn--solid profileBtn--ok" onClick={() => setProfileView("profile")}>
                  Ok
                </button>
              )}
            </div>
          </div>
        </div>
      </div>



















      {/* =======================================================
          ✅ BUY MODAL
          ======================================================= */}
      {buyOpen && (
        <div
          className={`buyOverlay ${buyOpen ? "isOpen" : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeBuyAll();
          }}
        >
          <div className={`buyModal ${buyOpen ? "isOpen" : ""}`} 
          role="dialog" 
          aria-modal="true" 
          onClick={(e) => e.stopPropagation()}
          >
            <div className="buyCard">
              {buyStep === 1 && (
                <>
                  <div className="buyBody">
                    <div className="buyCols">
                      <div className="buyCol buyCol--left">
                        <div className="buyHead">
                          <div className="buyTitle">Endereço</div>
                        </div>

                        <div className="buySub">Preencha os campos abaixo!</div>

                        <div className="buyFields">
                          <input className="buyInput" value={buyForm.fullName} onChange={(e) => setBuyForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Nome Completo" />
                          <input className="buyInput" value={buyForm.cpf} onChange={(e) => setBuyForm((p) => ({ ...p, cpf: e.target.value }))} placeholder="CPF" />
                          <input className="buyInput" value={buyForm.cep} onChange={(e) => setBuyForm((p) => ({ ...p, cep: e.target.value }))} placeholder="CEP" />
                          <input className="buyInput" value={buyForm.state} onChange={(e) => setBuyForm((p) => ({ ...p, state: e.target.value }))} placeholder="Estado" />
                        </div>
                      </div>

      <div className="buyCol buyCol--right" id="right">
                  <div className="buyFields">
                    <input
                      className="buyInput"
                      value={buyForm.city}
                      onChange={(e) => setBuyForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="Cidade"
                      aria-label="Cidade"
                    />
                    <input
                      className="buyInput"
                      value={buyForm.neighborhood}
                      onChange={(e) => setBuyForm((p) => ({ ...p, neighborhood: e.target.value }))}
                      placeholder="Bairro"
                      aria-label="Bairro"
                    />

                    <div className="buyRow2">
                      <input
                        className="buyInput"
                        value={buyForm.street}
                        onChange={(e) => setBuyForm((p) => ({ ...p, street: e.target.value }))}
                        placeholder="Rua"
                        aria-label="Rua"
                      />
                      <input
                        className="buyInput"
                        value={buyForm.number}
                        onChange={(e) => setBuyForm((p) => ({ ...p, number: e.target.value }))}
                        placeholder="Número"
                        aria-label="Número"
                      />
                    </div>
                  </div>
                </div>
                    </div>
                  </div>

                  <div className="buyFooter">
                    <button type="button" className="buyBtn buyBtn--ghost" onClick={closeBuyAll}>
                      Fechar
                    </button>
                    <button type="button" className="buyBtn buyBtn--solid" onClick={goNextBuyStep}>
                      Prosseguir
                    </button>
                  </div>
                </>
              )}

              {buyStep === 2 && (
                <>
                  <div className="buyBody">
                    <div className="buyCols">
                      <div className="buyCol buyCol--left buyPayLeft">
                        <div className="buyHead">
                          <div className="buyTitle" id="finalizarPedido">
                            Finalizar Pedido
                          </div>
                          <div className="buyOrder" id="pedidoFinalizado">
                            Pedido n° {orderNumber}
                          </div>
                        </div>

                        <div className="buyPayLabel">Forma de Pagamento</div>

                        <div className="buyPayOptions">
                          <div className="buyPayDots">
                            <span className={`buyDot ${payMethod === "pix" ? "isOn" : ""}`} />
                            <span className={`buyDot ${payMethod === "card" ? "isOn" : ""}`} />
                          </div>

                          <div className="buyPayList">
                            <button type="button" className={`buyPayItem ${payMethod === "pix" ? "isActive" : ""}`} onClick={() => setPayMethod("pix")}>
                              <span className="buyPayIcon" aria-hidden="true">
                                <img src={pix} alt="" />
                              </span>
                              <span>Pix</span>
                            </button>

                            <button type="button" className={`buyPayItem ${payMethod === "card" ? "isActive" : ""}`} onClick={() => setPayMethod("card")}>
                              <span className="buyPayIcon" aria-hidden="true">
                                <img src={debit} alt="" />
                              </span>
                              <span>Débito/Crédito</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="buyCol buyCol--right buyPayRight">
                        {payMethod === "pix" ? (
                          <div className="buyPix">
                            <div className="buyPixTime">
                              <span>Tempo Restante </span>
                              <span className="buyPixUnderline">{formatMMSS(pixSecondsLeft)}</span>
                            </div>

                            <img className="buyPixQR" src={qr} alt="QR Code PIX" />

                            <div className="buyPixHelp">
                              <div className="buyPixHelpText">Aponte a câmera do seu celular ou copie o código abaixo.</div>

                              <button type="button" className="buyPixCode" onClick={copyPix}>
                                <span className="buyPixCopyIcon" aria-hidden="true">
                                  <img src={copy} alt="" />
                                </span>
                                <span className="buyPixCodeText">{pixCode}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="buyCardPay">
                            <div className="buyCardPayTitle">Informações do Cartão</div>

                            <div className="buyFields">
                              <input className="buyInput" value={buyForm.cardName} onChange={(e) => setBuyForm((p) => ({ ...p, cardName: e.target.value }))} placeholder="Nome no Cartão" />
                              <input className="buyInput" value={buyForm.cardNumber} onChange={(e) => setBuyForm((p) => ({ ...p, cardNumber: e.target.value }))} placeholder="Número do Cartão" />

                              <div className="buyRow2">
                                <input className="buyInput" value={buyForm.cardExp} onChange={(e) => setBuyForm((p) => ({ ...p, cardExp: e.target.value }))} placeholder="Data de Validade" />
                                <input className="buyInput" value={buyForm.cardCvv} onChange={(e) => setBuyForm((p) => ({ ...p, cardCvv: e.target.value }))} placeholder="CVV" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="buyFooter">
                    {payMethod === "pix" ? (
                      <button type="button" className="buyBtn buyBtn--ghost" onClick={finishPurchase}>
                        Fechar
                      </button>
                    ) : (
                      <>
                        <button type="button" className="buyBtn buyBtn--ghost" onClick={closeBuyAll}>
                          Fechar
                        </button>
                        <button type="button" className="buyBtn buyBtn--solid" onClick={finishPurchase}>
                          Ok
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          ✅ PAY OK POPUP
          ======================================================= */}
      {payOkOpen && (
        <div className="payOverlay" onClick={(e) => { if (e.target === e.currentTarget) closePayOk(); }}>
          <div className="payModal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="payCard">
              <div className="paySide" />

              <div className="payCenter">
                <img className="payLike" src={like} alt="Pagamento concluído" />
                <div className="payTitle">
                  <span className="payTitleSmall">Pagamento </span>
                  <span className="payTitleBig">Concluído!</span>
                </div>

                <div className="payMsg">
                  <span>Seu pedido foi confirmado, acompanhe o andamento em </span>
                  <span className="payMsgStrong">“Confirmado(s)”.</span>
                </div>
              </div>

              <div className="payCloseWrap">
                <button type="button" className="payCloseBtn" onClick={closePayOk} aria-label="Fechar">
                  <img src={x} alt="" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
















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
              title={isLoggedIn ? `Ver perfil (${authUser?.name ?? authUser?.email ?? ""})` : "Entrar / Cadastrar"}
              onClick={handleProfileClick}
            >
              <img src={profileIcon} alt="" style={isLoggedIn ? { filter: "invert(35%) sepia(80%) saturate(400%) hue-rotate(100deg)" } : {}} />
            </button>

            <button className="drawer__btn" type="button" aria-label="Buscar" onClick={() => setSearchOpen((p) => !p)}>
              <img src={searchIcon} alt="" />
            </button>
          </nav>

          <div className="cartTitle" aria-label="Título do carrinho">
            <div className="cartTitle__text">Meu Carrinho</div>
            <img className="cartTitle__icon" src={cartIcon} alt="" aria-hidden="true" />
          </div>

          {!cart.length ? (
            <div className="cartEmpty">
              <div className="cartEmpty__text">Seu carrinho está vazio.</div>
              <Link className="cartEmpty__btn" to="/">
                Ver produtos
              </Link>
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
                              <select className="cartItem__size" value={x.size ?? ""} onChange={(e) => setSize(x.id, x.size, e.target.value)} aria-label="Selecionar tamanho">
                                {sizes.map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
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

                              <button className="cartItem__qtyBtn" onClick={() => setQty(x.id, x.size, (x.qty ?? 0) + 1)} aria-label="Aumentar quantidade">
                                +
                              </button>
                            </div>
                          </div>
                        </div>

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

                          <div className="cartSummary__itemPrice">R$ {(Number(x.price) || 0).toFixed(2)}</div>
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
                    style={{ position: "relative", zIndex: 50, pointerEvents: "auto" }}
                    onPointerDownCapture={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openBuy();
                    }}
                    onClickCapture={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openBuy();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openBuy();
                    }}
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