// Estado global
        let products = [];
        let categories = [];
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        let currentProduct = null;
        let user = JSON.parse(localStorage.getItem('user') || 'null');

        // Utilidades
        function renderCartCount() {
            document.getElementById('cartCount').textContent = cart.reduce((a, p) => a + p.qty, 0);
        }
        function saveCart() {
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCartCount();
        }
        function saveUser() {
            localStorage.setItem('user', JSON.stringify(user));
        }
        function showWelcome() {
            const msg = document.getElementById('welcomeMsg');
            msg.textContent = user ? `¡Bienvenido, ${user.name || user.email}!` : '';
        }

        // Renderizado de productos
        function renderProducts(list) {
            const container = document.getElementById('productsList');
            container.innerHTML = '';
            if (!list.length) {
                container.innerHTML = '<div class="col-12 text-center text-muted">No hay productos.</div>';
                return;
            }
            list.forEach(prod => {
                const col = document.createElement('div');
                col.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-4';
                col.innerHTML = `
                    <div class="card product-card h-100 shadow-sm">
                        <img src="${prod.image}" class="card-img-top product-img" alt="${prod.title}">
                        <div class="card-body d-flex flex-column">
                            <h6 class="card-title">${prod.title}</h6>
                            <p class="card-text mb-1"><strong>$${prod.price}</strong></p>
                            <button class="btn btn-outline-primary mt-auto" data-id="${prod.id}">Añadir al carrito</button>
                        </div>
                    </div>
                `;
                col.querySelector('.card-img-top').onclick = () => showProductDetails(prod.id);
                col.querySelector('button').onclick = () => addToCart(prod.id);
                container.appendChild(col);
            });
        }

        // Renderizado de categorias
        function renderCategories() {
            const sel = document.getElementById('categoryFilter');
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                sel.appendChild(opt);
            });
        }

        // Filtrado por categoria
        document.getElementById('categoryFilter').onchange = function() {
            const val = this.value;
            renderProducts(val ? products.filter(p => p.category === val) : products);
        };

        // Mostrar detalles de producto
        function showProductDetails(id) {
            const prod = products.find(p => p.id === id);
            if (!prod) return;
            currentProduct = prod;
            
            // Mostrar detalles del producto
            document.getElementById('modalTitle').textContent = prod.title;
            document.getElementById('modalImg').src = prod.image;
            document.getElementById('modalDesc').textContent = prod.description;
            document.getElementById('modalPrice').textContent = prod.price;
            
            const stock = prod.rating?.count || 10;
            document.getElementById('modalStock').textContent = stock;
            
            // Configurar input de cantidad
            const qtyInput = document.getElementById('modalQty');
            qtyInput.max = stock;
            qtyInput.value = 1;
            
            // Validar cantidad al cambiar
            qtyInput.onchange = function() {
                const qty = parseInt(this.value);
                const warning = document.getElementById('stockWarning');
                
                if (qty > stock) {
                    this.value = stock;
                    warning.textContent = `Solo hay ${stock} unidades disponibles`;
                } else if (qty < 1) {
                    this.value = 1;
                    warning.textContent = 'La cantidad mínima es 1';
                } else {
                    warning.textContent = '';
                }
            };
            
            new bootstrap.Modal(document.getElementById('productModal')).show();
        }
        document.getElementById('modalAddCart').onclick = function() {
            if (currentProduct) addToCart(currentProduct.id);
            bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        };

        document.getElementById('modalAddCart').addEventListener('click', function() {
            // Animacion shake al boton del carrito
            const cartBtn = document.getElementById('cartBtn');
            cartBtn.classList.add('shake');
            setTimeout(() => cartBtn.classList.remove('shake'), 400);

            // Mostrar toast de Bootstrap
            const toastEl = document.getElementById('cartToast');
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        });

        // Añadir al carrito
        function addToCart(id) {
            const prod = products.find(p => p.id === id);
            if (!prod) return;
            
            const stock = prod.rating?.count || 10;
            const qty = parseInt(document.getElementById('modalQty')?.value || 1);
            
            // Verificar cantidad actual en carrito
            const cartItem = cart.find(item => item.id === id);
            const currentQty = cartItem ? cartItem.qty : 0;
            
            if (currentQty + qty > stock) {
                alert(`No hay suficiente stock. Solo quedan ${stock - currentQty} unidades disponibles`);
                return;
            }
            
            if (cartItem) {
                cartItem.qty += qty;
            } else {
                cart.push({ ...prod, qty });
            }
            
            saveCart();
            renderCartCount();
            
            // Mostrar toast de confirmación
            const toast = new bootstrap.Toast(document.getElementById('cartToast'));
            toast.show();
        }

        // Mostrar carrito
        document.getElementById('cartBtn').onclick = function() {
            renderCart();
            new bootstrap.Modal(document.getElementById('cartModal')).show();
        };
        // Actualizar renderCart para habilitar/deshabilitar botón de pago
        function renderCart() {
            const cont = document.getElementById('cartItems');
            cont.innerHTML = '';
            cart.forEach((item, i) => {
                const row = document.createElement('div');
                row.className = 'd-flex align-items-center mb-2';
                row.innerHTML = `
                    <img src="${item.image}" width="40" class="me-2" alt="">
                    <div class="flex-grow-1">
                        <div>${item.title}</div>
                        <small>$${item.price} x ${item.qty}</small>
                    </div>
                    <button class="btn btn-sm btn-danger ms-2" title="Eliminar">✕</button>
                `;
                row.querySelector('button').onclick = () => {
                    cart.splice(i, 1);
                    saveCart();
                    renderCart();
                };
                cont.appendChild(row);
            });
            const total = cart.reduce((a, p) => a + p.price * p.qty, 0).toFixed(2);
            document.getElementById('cartTotal').textContent = total;
            document.getElementById('paymentAmount').textContent = total;
            
            // Habilitar/deshabilitar botón de pago
            const checkoutBtn = document.getElementById('checkoutBtn');
            checkoutBtn.disabled = cart.length === 0;
        }

        // Manejar el proceso de pago
        document.getElementById('checkoutBtn').onclick = function() {
            if (!cart.length) return;
            bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
            new bootstrap.Modal(document.getElementById('paymentModal')).show();
        };

        document.getElementById('paymentForm').onsubmit = function(e) {
            e.preventDefault();
            
            // Validar nombre de la tarjeta
            const cardName = document.getElementById('cardName');
            if (!/^[A-Za-zÁ-ÿ\s]+$/.test(cardName.value)) {
                cardName.classList.add('is-invalid');
                return;
            }
            
            // Simular procesamiento
            const btn = e.target.querySelector('button');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';
            
            setTimeout(() => {
                const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
                paymentModal.hide();
                alert(`¡Pago realizado con éxito! Gracias por tu compra, ${cardName.value}. 🛍️🎊`);
                cart = [];
                saveCart();
                renderCart();
                renderCartCount();
                
                // Resetear el formulario y el botón después de ocultar el modal
                setTimeout(() => {
                    e.target.reset();
                    cardName.classList.remove('is-invalid');
                    btn.disabled = false;
                    btn.innerHTML = `Pagar $${document.getElementById('paymentAmount').textContent}`;
                }, 200);
            }, 2000);
        };

        // Login simulado
        document.getElementById('loginBtn').onclick = function() {
            new bootstrap.Modal(document.getElementById('loginModal')).show();
        };
        document.getElementById('loginForm').onsubmit = async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPass').value;
            try {
                const res = await fetch('https://reqres.in/api/login', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-api-key': 'reqres-free-v1'
                    },
                    body: JSON.stringify({ email, password })
                });
                if (!res.ok) throw new Error('Login fallido');
                user = { email, name: email.split('@')[0] };
                saveUser();
                showWelcome();
                bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            } catch {
                alert('Email o contraseña incorrectos.');
            }
        };

        // Inicializacion
        async function init() {
            // Cargar productos y categorias de FakeStoreAPI
            const [prods, cats] = await Promise.all([
                fetch('https://fakestoreapi.com/products').then(r => r.json()),
                fetch('https://fakestoreapi.com/products/categories').then(r => r.json())
            ]);

            const categoriasTraducidas = {
                "electronics": "electrónica",
                "jewelery": "joyería",
                "men's clothing": "ropa de hombre",
                "women's clothing": "ropa de mujer"
            };
            categories = cats.map(cat => categoriasTraducidas[cat] || cat);
            products = prods.map(prod => ({
                ...prod,
                category: categoriasTraducidas[prod.category] || prod.category
            }));
            renderCategories();
            renderProducts(products);
            renderCartCount();
            showWelcome();
        }
        init();