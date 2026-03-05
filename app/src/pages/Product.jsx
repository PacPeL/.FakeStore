import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useStore } from "../store.jsx";
import { useAuthModal } from "../hooks/useAuthModal.js";
import AuthModal from "../components/AuthModal.jsx";
import "../styles/product.scss";
import "../styles/auth.scss";
import "../styles/logo.scss";
import "../styles/profile.scss";
import "../styles/purchase.scss";

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

import check from "../assets/check.svg";
import truck from "../assets/truck.svg";
import box from "../assets/box.svg";

const ORIGINAL_MARKUP = 0.10;
const PIX_DISCOUNT    = 0.10;
const INSTALLMENTS    = 10;

function formatBRL(v) {
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0); }
  catch { return `R$ ${(v ?? 0).toFixed(2)}`; }
}

export default function Product() {
  const { id }  = useParams();
  const nav     = useNavigate();
  const { addToCart, isLoggedIn, logout, authUser } = useStore();
  const auth    = useAuthModal();

  const [p, setP]             = useState(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize]       = useState(null);

  const [q, setQ]                   = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef              = useRef(null);

  // ✅ PERFIL
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

  const [reviews, setReviews]             = useState([]);
  const [myRating, setMyRating]           = useState(0);
  const [hoverRating, setHoverRating]     = useState(0);
  const [myComment, setMyComment]         = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg]         = useState("");
  const [reviewError, setReviewError]     = useState("");

  const recentTags = [
    "Chuteira", "Tênis", "Bola",
    "Luva", "Calça", "Shorts",
  ];

  useEffect(() => {
    setLoading(true);
    api.getProduct(id)
      .then((data) => {
        setP(data);
        if (data?.sizes?.length) setSize(data.sizes[0]);
        else setSize(null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.getReviews(id)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [id]);

  useEffect(() => {
    if (!isLoggedIn || !authUser || reviews.length === 0) return;
    const mine = reviews.find((r) => r.user?._id?.toString() === authUser._id?.toString());
    if (mine) {
      setMyRating(mine.rating);
      setMyComment(mine.comment ?? "");
    }
  }, [reviews, isLoggedIn, authUser]);

  const basePrice     = useMemo(() => Number(p?.price ?? 0), [p]);
  const originalPrice = useMemo(() => basePrice * (1 + ORIGINAL_MARKUP), [basePrice]);
  const pixPrice      = useMemo(() => basePrice * (1 - PIX_DISCOUNT), [basePrice]);
  const installment   = useMemo(() => pixPrice / INSTALLMENTS, [pixPrice]);

  const ratingAvg   = useMemo(() => Math.min(5, Math.max(0, Number(p?.rating?.rate ?? 0))), [p]);
  const ratingCount = useMemo(() => Number(p?.rating?.count ?? 0), [p]);

  // ✅ GUARD: comprar
  const requireAuthToBuy = () => {
    if (isLoggedIn) return true;
    window.alert("Você precisa estar logado para comprar.");
    auth.openAuth("login");
    return false;
  };

  // ✅ GUARD: carrito con alerta
  const requireAuthToCart = () => {
    if (isLoggedIn) return true;
    window.alert("Você precisa estar logado para adicionar ao carrinho.");
    auth.openAuth("login");
    return false;
  };












  
  // ==========================
  // ✅ NUEVO: POPUP DE COMPRA
  // ==========================
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyStep, setBuyStep] = useState(1);
  const [payMethod, setPayMethod] = useState("pix");
  const [pixSecondsLeft, setPixSecondsLeft] = useState(180);

// ✅ POPUP "Pagamento Concluído!"
const [payOkOpen, setPayOkOpen] = useState(false);

const openPayOk = () => setPayOkOpen(true);
const closePayOk = () => setPayOkOpen(false);

// ✅ finalizar compra (UI)
const finishPurchase = () => {
  // cierra el modal de compra
  closeBuyAll();
  // abre el popup de éxito
  setTimeout(() => setPayOkOpen(true), 0);
};













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

  const goNextBuyStep = () => setBuyStep(2);
  // ==========================
  // END NUEVO POPUP DE COMPRA
  // ==========================

  useEffect(() => {
    const handle = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        auth.closeAuth();
        setProfileOpen(false);
        if (buyOpen) closeBuyAll();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [auth, buyOpen]);





useEffect(() => {
  if (!searchOpen && !auth.authOpen && !profileOpen && !buyOpen) return;

  const handle = (e) => {
    // ✅ Si el BUY está abierto, NO cierres nada por document click.
    // El overlay ya se encarga de cerrar cuando toca el fondo.
    if (buyOpen) return;

    if (e.target.closest(".searchHeader")) return;
    if (e.target.closest(".drawer")) return;
    if (e.target.closest(".authModal")) return;
    if (e.target.closest(".profileModal")) return;

    if (auth.authOpen) auth.closeAuth();
    if (searchOpen) setSearchOpen(false);
    if (profileOpen) setProfileOpen(false);
  };

  document.addEventListener("click", handle);
  return () => document.removeEventListener("click", handle);
}, [searchOpen, auth, profileOpen, buyOpen]);





  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 80);
  }, [searchOpen]);

  const goToCatalog = (query) => {
    nav(`/catalog?q=${encodeURIComponent(query ?? "")}`);
    setSearchOpen(false);
  };

  const handleProfileClick = () => {
    if (isLoggedIn) setProfileOpen(true);
    else auth.openAuth("login");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { auth.openAuth("login"); return; }
    if (myRating === 0) { setReviewError("Selecione uma nota de 1 a 5."); return; }
    setReviewLoading(true); setReviewError(""); setReviewMsg("");
    try {
      await api.submitReview(id, myRating, myComment);
      setReviewMsg("Avaliação salva com sucesso!");
      const [newReviews, newProduct] = await Promise.all([
        api.getReviews(id),
        api.getProduct(id),
      ]);
      setReviews(newReviews);
      setP(newProduct);
      setTimeout(() => setReviewMsg(""), 4000);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    setReviewLoading(true); setReviewError(""); setReviewMsg("");
    try {
      await api.deleteReview(id);
      setMyRating(0); setMyComment("");
      const [newReviews, newProduct] = await Promise.all([
        api.getReviews(id),
        api.getProduct(id),
      ]);
      setReviews(newReviews);
      setP(newProduct);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <div className="product">Carregando...</div>;
  if (!p)      return <div className="product">Produto não encontrado.</div>;

  const sizes = p.sizes ?? [];
  const hasAlreadyReviewed = isLoggedIn && reviews.some(
    (r) => r.user?._id?.toString() === authUser?._id?.toString()
  );

  return (
    <div className="product">
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























{/* =======================================================
    ✅ INICIO: APARTADO DE COMPRA (BUY MODAL / POPUP)
    ======================================================= */}
{buyOpen && (
  <div
    className={`buyOverlay ${buyOpen ? "isOpen" : ""}`}
    onClick={(e) => {
      // ✅ SOLO cierra si el click fue en el fondo (overlay), NO en el modal
      if (e.target === e.currentTarget) closeBuyAll();
    }}
  >
    <div
      className={`buyModal ${buyOpen ? "isOpen" : ""}`}
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="buyCard">
        {/* STEP 1: ENDEREÇO */}
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
                    <input
                      className="buyInput"
                      value={buyForm.fullName}
                      onChange={(e) => setBuyForm((p) => ({ ...p, fullName: e.target.value }))}
                      placeholder="Nome Completo"
                      aria-label="Nome Completo"
                    />
                    <input
                      className="buyInput"
                      value={buyForm.cpf}
                      onChange={(e) => setBuyForm((p) => ({ ...p, cpf: e.target.value }))}
                      placeholder="CPF"
                      aria-label="CPF"
                    />
                    <input
                      className="buyInput"
                      value={buyForm.cep}
                      onChange={(e) => setBuyForm((p) => ({ ...p, cep: e.target.value }))}
                      placeholder="CEP"
                      aria-label="CEP"
                    />
                    <input
                      className="buyInput"
                      value={buyForm.state}
                      onChange={(e) => setBuyForm((p) => ({ ...p, state: e.target.value }))}
                      placeholder="Estado"
                      aria-label="Estado"
                    />
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

        {/* STEP 2: PAGAMENTO */}
        {buyStep === 2 && (
          <>
            <div className="buyBody">
              <div className="buyCols">
                <div className="buyCol buyCol--left buyPayLeft">
                  <div className="buyHead">
                    <div className="buyTitle" id="finalizarPedido">Finalizar Pedido</div>
                    <div className="buyOrder" id="pedidoFinalizado">Pedido n° {orderNumber}</div>
                  </div>

                  <div className="buyPayLabel">Forma de Pagamento</div>

                  <div className="buyPayOptions">
                    <div className="buyPayDots">
                      <span className={`buyDot ${payMethod === "pix" ? "isOn" : ""}`} />
                      <span className={`buyDot ${payMethod === "card" ? "isOn" : ""}`} />
                    </div>

                    <div className="buyPayList">
                      <button
                        type="button"
                        className={`buyPayItem ${payMethod === "pix" ? "isActive" : ""}`}
                        onClick={() => setPayMethod("pix")}
                      >
                        <span className="buyPayIcon" aria-hidden="true">
                          <img src={pix} alt="" />
                        </span>
                        <span>Pix</span>
                      </button>

                      <button
                        type="button"
                        className={`buyPayItem ${payMethod === "card" ? "isActive" : ""}`}
                        onClick={() => setPayMethod("card")}
                      >
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
                        <div className="buyPixHelpText">
                          Aponte a câmera do seu celular ou copie o código abaixo.
                        </div>

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
                        <input
                          className="buyInput"
                          value={buyForm.cardName}
                          onChange={(e) => setBuyForm((p) => ({ ...p, cardName: e.target.value }))}
                          placeholder="Nome no Cartão"
                          aria-label="Nome no Cartão"
                        />
                        <input
                          className="buyInput"
                          value={buyForm.cardNumber}
                          onChange={(e) => setBuyForm((p) => ({ ...p, cardNumber: e.target.value }))}
                          placeholder="Número do Cartão"
                          aria-label="Número do Cartão"
                        />

                        <div className="buyRow2">
                          <input
                            className="buyInput"
                            value={buyForm.cardExp}
                            onChange={(e) => setBuyForm((p) => ({ ...p, cardExp: e.target.value }))}
                            placeholder="Data de Validade"
                            aria-label="Data de Validade"
                          />
                          <input
                            className="buyInput"
                            value={buyForm.cardCvv}
                            onChange={(e) => setBuyForm((p) => ({ ...p, cardCvv: e.target.value }))}
                            placeholder="CVV"
                            aria-label="CVV"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ FOOTER distinto según método */}
            <div className="buyFooter">
              {payMethod === "pix" ? (
                // ✅ En PIX: Fechar también finaliza (abre popup éxito)
                <button type="button" className="buyBtn buyBtn--ghost" onClick={finishPurchase}>
                  Fechar
                </button>
              ) : (
                // ✅ En cartão: Fechar + Ok (como en Figma)
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
    ✅ FIM: APARTADO DE COMPRA (BUY MODAL / POPUP)
    ======================================================= */}



{/* =======================================================
    ✅ POPUP: PAGAMENTO CONCLUÍDO
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
{/* =======================================================
    ✅ FIM POPUP: PAGAMENTO CONCLUÍDO
    ======================================================= */}






























      {/* ===== HERO ===== */}
      <section className="pHero">
        <img src={logo} alt="Logo" className="logo" />

        <div className="pHero__wrap">
          <h1 className="pTitle">{p.title}</h1>

          <div className="pRating">
            <div className="pRating__stars" aria-label={`Avaliação média ${ratingAvg.toFixed(1)} de 5`}>
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = ratingAvg >= i + 1;
                const half   = !filled && ratingAvg > i;
                return (
                  <span key={i} className={`pStar ${filled ? "isFilled" : ""} ${half ? "isHalf" : ""}`}>★</span>
                );
              })}
            </div>
            <div className="pRating__text">
              {ratingCount > 0 ? `${ratingCount} avaliação${ratingCount > 1 ? "ões" : ""}` : "Sem avaliações"}
            </div>
          </div>

          {sizes.length > 0 && (
            <div className="pSizes">
              <div className="pSizes__label">Tamanho:</div>
              <div className="pSizes__grid">
                {sizes.map((n) => (
                  <button key={n} type="button"
                    className={`pSize ${size === n ? "isActive" : ""}`}
                    onClick={() => setSize(n)}
                    aria-pressed={size === n}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pPrice">
            <div className="pPrice__from">
              <span className="pPrice__fromLabel">de</span>{" "}
              <span className="pPrice__fromValueR">R$</span>{" "}
              <span className="pPrice__fromValue">{(originalPrice).toFixed(2)}</span>{" "}
              <span className="pPrice__fromLabel">por apenas</span>
            </div>

            <div className="pPrice__pix">
              <span className="pPrice__pixRS">R$</span>
              <span className="pPrice__pixValue">{pixPrice.toFixed(2).replace(".", ",")}</span>
              <span className="pPrice__pixLabel">no</span>
              <span className="pPrice__pixMethod">PIX</span>
            </div>

            <div className="pPrice__inst">
              ou <strong>{INSTALLMENTS}x</strong> de <strong>{formatBRL(installment)}</strong> sem juros
            </div>

            <div className="pBuyRow">






          <button
            className="pBuy"
            type="button"
            style={{ position: "relative", zIndex: 50, pointerEvents: "auto" }} // 👈 fuerza arriba
            onPointerDownCapture={(e) => { e.preventDefault(); e.stopPropagation(); openBuy(); }} // 👈 dispara antes que capas raras
            onClickCapture={(e) => { e.preventDefault(); e.stopPropagation(); openBuy(); }}       // 👈 backup
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openBuy(); }}              // 👈 backup final
          >
            Comprar
          </button>









              <button
                className="pBuyCart"
                type="button"
                onClick={() => {
                  if (!requireAuthToCart()) return;
                  addToCart({ ...p, size });
                  window.alert("Produto adicionado ao carrinho!");
                }}
                aria-label="Adicionar ao carrinho"
              >
                <img src={cartIcon} alt="" />
              </button>
            </div>
          </div>

          <div className="pHero__media">
            <img src={p.image} alt={p.title} />
          </div>

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
              onClick={() => setSearchOpen((pp) => !pp)}
            >
              <img src={searchIcon} alt="" />
            </button>
          </nav>

          <div className="pPromo">
            <span className="pPromo__strong">Registre-se</span> e ganhe{" "}
            <span className="pPromo__strong">10%</span> de desconto usando o cupom{" "}
            <span className="pPromo__strong">COMPRA1</span> na sua primeira compra feita pelo{" "}
            <span className="pPromo__strong">site</span>.
          </div>
        </div>
      </section>

      <section className="pContent">
        <div className="pContent__inner">
          <div className="pDesc" id="descricao">
            <div className="pDesc__title">Descrição do Produto:</div>
            <div className="pDesc__text">{p.description}</div>
          </div>
        </div>
      </section>

      <section className="pReviews">
        <div className="pReviews__inner">
          <div className="pReviews__title">Avaliações:</div>
          <div className="pReviews__sub">O que os clientes estão dizendo sobre o produto?</div>

          <div className="reviewForm">
            {!isLoggedIn ? (
              <div className="reviewForm__login">
                <span>Faça </span>
                <button
                  type="button"
                  className="reviewForm__loginLink"
                  onClick={() => auth.openAuth("login")}
                >
                  login
                </button>
                <span> para avaliar este produto.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="reviewForm__form">
                <div className="reviewForm__stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button"
                      className={`reviewForm__star ${(hoverRating || myRating) >= n ? "isActive" : ""}`}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setMyRating(n)}
                      aria-label={`Nota ${n}`}>
                      ★
                    </button>
                  ))}
                  <span className="reviewForm__ratingLabel">
                    {hoverRating || myRating
                      ? ["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"][hoverRating || myRating]
                      : "Selecione uma nota"}
                  </span>
                </div>

                <div className="reviewForm__commentBox">
                  <textarea className="reviewForm__comment"
                    placeholder="Comentário (opcional)..."
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    rows={3} maxLength={500} />
                </div>

                {reviewError && <div className="authError" style={{ marginBottom: 8 }}>{reviewError}</div>}
                {reviewMsg   && <div className="reviewForm__success">{reviewMsg}</div>}

                <div className="reviewForm__actions">
                  <button type="submit" className="reviewForm__submit" disabled={reviewLoading}>
                    {reviewLoading ? "Salvando..." : hasAlreadyReviewed ? "Atualizar avaliação" : "Enviar avaliação"}
                  </button>
                  {hasAlreadyReviewed && (
                    <button type="button" className="reviewForm__delete" disabled={reviewLoading}
                      onClick={handleDeleteReview}>
                      Remover
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="pReviews__empty">
              Ainda não há avaliações. Seja o primeiro a avaliar!
            </div>
          ) : (
            <div className="reviewList">
              {reviews.map((r) => (
                <div key={r._id} className="reviewItem">
                  <div className="reviewItem__header">
                    <span className="reviewItem__author">{r.user?.name ?? "Usuário"}</span>
                    <span className="reviewItem__stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`reviewItem__star ${i < r.rating ? "isFilled" : ""}`}>★</span>
                      ))}
                    </span>
                    <span className="reviewItem__date">
                      {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {r.comment && <div className="reviewItem__comment">{r.comment}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="footerbar" />
    </div>
  );
}