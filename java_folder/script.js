// ==========================================
// 1. CONFIGURARE STRIPE
// ==========================================
const stripe = Stripe("pk_test_XXXXXXXXXXXXXXXXXXXXXXXX"); 

document.addEventListener("DOMContentLoaded", () => {
    
    // --- PORNIRE PRELOADER ---
    handlePreloader();

    // --- LOGICA PENTRU PLANURI (CHECKBOX + ACORDEON) ---
    initPricingLogic();

    // --- NOU: LOGICA PENTRU SLIDER-UL DE PLANURI PREMIUM ---
    initPricingSlider();

    // --- ALTE FUNCȚII EXISTENTE ---
    checkStatus();
    handleScrollAnimation();
    handleHowItWorks(); 
    handleScrollSpy();
    handleLoginModal();
});

// ==========================================
// 2. LOGICA NOUĂ PRICING (MODIFICATĂ)
// ==========================================
function initPricingLogic() {
    const cards = document.querySelectorAll('.pricing-card');

    cards.forEach(card => {
        const checkbox = card.querySelector('.terms-check');
        const button = card.querySelector('.btn-plan');
        const toggle = card.querySelector('.details-toggle');
        const features = card.querySelector('.plan-features');

        // A. Logica Checkbox -> Activare Buton
        if(checkbox && button) {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    button.disabled = false;
                    button.classList.add('active');
                    
                    // Schimbare text folosind sistemul de traducere existent (dacă este disponibil)
                    if(card.classList.contains('standard')) {
                        const btnText = window.getTranslation ? window.getTranslation('btn_get_free') : 'Get Free Access';
                        button.innerHTML = `${btnText} <i class="fa-solid fa-check"></i>`;
                    }
                } else {
                    button.disabled = true;
                    button.classList.remove('active');
                    
                    // Resetare text la starea inițială dezactivată
                    if(card.classList.contains('standard')) {
                        const btnText = window.getTranslation ? window.getTranslation('btn_start_free') : 'Start Free';
                        button.innerHTML = `${btnText} <i class="fa-solid fa-arrow-right"></i>`;
                    }
                }
            });
        }

        // B. Logica Acordeon (Săgeata pentru detalii abonament)
        if(toggle && features) {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active'); // Rotește săgeata
                features.classList.toggle('open'); // Deschide lista
            });
        }

        // C. Logica Click pe Buton Plată
        if(button) {
            button.addEventListener('click', (e) => {
                const planId = button.getAttribute('data-plan'); // 'gold' sau 'platinum'
                if (planId) {
                    redirectToCheckout(e, planId);
                } else {
                    // Cazul pentru Standard (Free)
                    window.location.href = "/dashboard-free"; 
                }
            });
        }
    });
}

// ==========================================
// 3. FUNCȚII EXISTENTE (PLATA, SCROLL, ETC)
// ==========================================
async function redirectToCheckout(e, planType = "engai-pro") {
    e.preventDefault();
    
    // Găsim butonul specific care a declanșat evenimentul
    const currentBtn = e.currentTarget;
    const originalContent = currentBtn.innerHTML;
    
    setLoading(true, currentBtn);

    try {
        const response = await fetch("http://localhost:4242/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                items: [{ id: planType }], // Trimitem ID-ul planului (gold/platinum)
                locale: localStorage.getItem('preferredLanguage') || 'en' 
            }),
        });
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        const { url } = await response.json();
        if (url) window.location.href = url;
    } catch (error) {
        console.error("Eroare:", error);
        const errorMsg = (window.getTranslation) ? window.getTranslation('server_error_title') : "Connection error.";
        showMessage(errorMsg);
        setLoading(false, currentBtn, originalContent);
    }
}

function checkStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success")) showMessage("Payment successful!", "success");
    if (urlParams.get("canceled")) showMessage("Payment canceled.");
}

function showMessage(messageText, type = "error") {
    const messageContainer = document.querySelector("#payment-message");
    if(!messageContainer) return;
    messageContainer.classList.remove("hidden");
    messageContainer.textContent = messageText;
    messageContainer.style.color = type === "success" ? "#10b981" : "#ef4444";
    if(type !== "success") setTimeout(() => messageContainer.classList.add("hidden"), 6000);
}

// Am modificat setLoading pentru a accepta butonul specific
function setLoading(isLoading, btn = null, originalText = "") {
    const submitBtn = btn || document.querySelector("#submit");
    const spinner = document.querySelector("#spinner");
    const btnText = document.querySelector("#button-text");
    
    // Folosim traducerea pentru "Processing..." dacă e disponibilă
    const loadingText = window.getTranslation ? window.getTranslation('msg_processing') : 'Processing...';

    if (isLoading) {
        if(submitBtn) submitBtn.disabled = true;
        if(spinner) spinner.classList.remove("hidden");
        if(btnText) btnText.style.display = "none";
        if(btn && !btnText) btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${loadingText}`;
    } else {
        if(submitBtn) submitBtn.disabled = false;
        if(spinner) spinner.classList.add("hidden");
        if(btnText) btnText.style.display = "block";
        if(btn && originalText) btn.innerHTML = originalText;
    }
}

function handleScrollAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('active');
            else entry.target.classList.remove('active');
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
}

function handleStatsAnimation() {
    const statsSection = document.querySelector('.intro-section'); 
    const counters = document.querySelectorAll('.stat-number');
    let hasAnimated = false; 
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true; 
                counters.forEach((counter) => {
                    counter.textContent = '0';
                    const targetAttr = counter.getAttribute('data-target');
                    const target = parseFloat(targetAttr); 
                    const duration = 2000; const stepTime = 20; 
                    const increment = target / (duration / stepTime);
                    let current = 0;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            counter.textContent = Number.isInteger(target) ? target : target.toFixed(1);
                            clearInterval(timer);
                        } else { counter.textContent = Math.floor(current); }
                    }, stepTime);
                });
            } else if (!entry.isIntersecting) {
                hasAnimated = false; 
                counters.forEach(c => c.textContent = '0'); 
            }
        });
    }, { threshold: 0.5 });
    if (statsSection) observer.observe(statsSection);
}

function handleHowItWorks() {
    const steps = document.querySelectorAll('.hiw-step');
    const mainImage = document.getElementById('hiw-main-image');
    let isAnimating = false;
    steps.forEach(step => {
        step.addEventListener('click', function() {
            if (this.classList.contains('active') || isAnimating) return;
            isAnimating = true;
            const newImageSrc = this.getAttribute('data-image');
            steps.forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            mainImage.classList.add('image-fade-out');
            setTimeout(() => {
                mainImage.src = newImageSrc;
                mainImage.classList.remove('image-fade-out');
                mainImage.classList.add('image-fade-in');
                setTimeout(() => {
                    mainImage.classList.remove('image-fade-in');
                    isAnimating = false;
                }, 400); 
            }, 400);
        });
    });
}

function handleScrollSpy() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id], div[id]');
    const headerOffset = 100; 
    function highlightActiveLink() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY;
        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerOffset - 50;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === currentSectionId) {
                link.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', highlightActiveLink);
    highlightActiveLink(); 
}

function handlePreloader() {
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        document.body.classList.add('loaded');
        setTimeout(() => {
            document.body.style.overflow = 'auto';
            handleStatsAnimation();
        }, 1200);
    }, 5000); 
}

function handleLoginModal() {
    const loginBtn = document.querySelector('.login-btn'); 
    const modal = document.getElementById('login-modal');
    const closeBtn = document.querySelector('.modal-close');

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal());
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ==========================================
// 4. LOGICA NOUĂ: SLIDER PLANURI PREMIUM
// ==========================================
function initPricingSlider() {
    const cards = document.querySelectorAll('.pricing-card');
    const prevBtn = document.getElementById('prev-plan');
    const nextBtn = document.getElementById('next-plan');
    
    // Verificăm dacă elementele există în pagină
    if (!cards.length || !prevBtn || !nextBtn) return;

    let currentPlanIndex = 0; // Plecam de la primul card (Standard = 0)

    function updatePlanSlider() {
        cards.forEach((card, index) => {
            // Curățăm clasele adăugate de efect
            card.classList.remove('active-card', 'passed-card');
            
            if (index === currentPlanIndex) {
                card.classList.add('active-card');
            } else if (index < currentPlanIndex) {
                card.classList.add('passed-card');
            }
        });

        // Activăm/Dezactivăm săgețile ca să nu trecem de limite
        prevBtn.disabled = currentPlanIndex === 0;
        nextBtn.disabled = currentPlanIndex === cards.length - 1;
    }

    // Buton Înapoi
    prevBtn.addEventListener('click', () => {
        if (currentPlanIndex > 0) {
            currentPlanIndex--;
            updatePlanSlider();
        }
    });

    // Buton Înainte
    nextBtn.addEventListener('click', () => {
        if (currentPlanIndex < cards.length - 1) {
            currentPlanIndex++;
            updatePlanSlider();
        }
    });

    // Setăm starea inițială direct la încărcare
    updatePlanSlider();
}