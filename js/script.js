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
            document.getElementById('modalTitle').textContent = prod.title;
            document.getElementById('modalImg').src = prod.image;
            document.getElementById('modalDesc').textContent = prod.description;
            document.getElementById('modalPrice').textContent = prod.price;
            document.getElementById('modalStock').textContent = prod.rating?.count || 10;
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
            const idx = cart.findIndex(p => p.id === id);
            if (idx >= 0) cart[idx].qty++;
            else cart.push({ id, title: prod.title, price: prod.price, image: prod.image, qty: 1 });
            saveCart();
        }

        // Mostrar carrito
        document.getElementById('cartBtn').onclick = function() {
            renderCart();
            new bootstrap.Modal(document.getElementById('cartModal')).show();
        };
        function renderCart() {
            const cont = document.getElementById('cartItems');
            if (!cart.length) {
                cont.innerHTML = '<div class="text-center text-muted">El carrito está vacío.</div>';
                document.getElementById('cartTotal').textContent = '0';
                return;
            }
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
            document.getElementById('cartTotal').textContent =
                cart.reduce((a, p) => a + p.price * p.qty, 0).toFixed(2);
        }

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