import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../store.jsx";
import "../styles/cart.scss";

import drawerIcon from "../assets/drawer_icon.svg";
import profileIcon from "../assets/iconamoon_profile-light.svg";
import cartIcon from "../assets/lineicons_cart-1.svg";
import searchIcon from "../assets/icon.svg";

const SIZES = [34, 35, 36, 37, 38, 39, 40, 41, 42, 43];

export default function Cart() {
  const { state, removeFromCart, setQty, clearCart, cartTotal, setSize } = useStore();
  const cart = state.cart;

  const [toast, setToast] = useState("");
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e) => {
      if (e.target.closest(".searchHeader")) return;
      if (e.target.closest(".drawer")) return;
      setSearchOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
        if (searchInputRef.current.select) searchInputRef.current.select();
      }, 80);
    }
  }, [searchOpen]);

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

  const itemsCount = cart.reduce((acc, it) => acc + (it.qty ?? 0), 0);

  return (
    <div className="cart">
      {/* SEARCH HEADER */}
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
            aria-label="Buscar produtos"
          />
        </div>

        <div className="searchHeader__section">
          <div className="searchHeader__title">Mais buscados</div>
        </div>

        <div className="searchHeader__tags">
          {recentTags.map((t) => (
            <button key={t} type="button" className="tag" onClick={() => handleTagClick(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="cartHero">
        <div className="cartHero__wrap">
          <div className="cartHero__brand">po</div>

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
            <button className="drawer__btn" type="button" aria-label="Buscar" onClick={toggleSearch}>
              <img src={searchIcon} alt="" />
            </button>
          </nav>

          <div className="cartHero__titleBox">
            <div className="cartHero__title">Carrinho</div>
            <div className="cartHero__desc">
              Aqui estão os produtos que voce adicionou à “Carrinho”.
            </div>
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
                {cart.map((x) => (
                  <div key={`${x.id}-${x.size}`} className="cartItem">
                    <div className="cartItem__inner">
                      <img className="cartItem__img" src={x.image} alt={x.title} />
                      <div className="cartItem__info">
                        <div className="cartItem__name">{x.title}</div>
                        <div className="cartItem__controls">
                          <select
                            className="cartItem__size"
                            value={Number(x.size)}
                            onChange={(e) => setSize(x.id, x.size, Number(e.target.value))}
                            aria-label="Selecionar tamanho"
                          >
                            {SIZES.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                          <div className="cartItem__qty">
                            <button
                              className="cartItem__qtyBtn"
                              onClick={() => {
                                const newQty = Math.max(0, (x.qty ?? 0) - 1);
                                if (newQty <= 0) {
                                  removeFromCart(x.id, x.size);
                                } else {
                                  setQty(x.id, x.size, newQty);
                                }
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
                      <div className="cartItem__price">R$ {(x.price * x.qty).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

<aside className="cartSummary">
  <div className="cartSummary__top">
    <div className="cartSummary__left">
      <div className="cartSummary__title">Resumo</div>

      {/* Lista de items: cantidad y precio unitario */}
      {cart.map((x) => (
        <div key={`${x.id}-${x.size}`} className="cartSummary__itemRow">
          <div className="cartSummary__itemQty">{x.qty} item(s)</div>
          <div className="cartSummary__itemPrice">R$ {x.price.toFixed(2)}</div>
        </div>
      ))}
    </div>

    <div className="cartSummary__right">
      <div className="cartSummary__value">R$ {cartTotal.toFixed(2)}</div>
    </div>
  </div>

  <div className="cartSummary__divider" />

  <div className="cartSummary__body">
    {/* Total en una sola fila: label a la izquierda, valor a la derecha */}
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
      onClick={() => {
        showToast("Compra realizada com sucesso!");
        clearCart();
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
