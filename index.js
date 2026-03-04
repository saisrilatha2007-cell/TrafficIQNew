document.addEventListener("DOMContentLoaded", () => {
    // --- 1. HTML5 CANVAS SMOKE ENGINE (NIGHT MODE) ---
    const canvas = document.getElementById('smoke-canvas');
    const ctx = canvas.getContext('2d');
    const car = document.getElementById('car');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let particles = [];
    let isSpeeding = false;

    function getExhaustPosition() {
        const rect = car.getBoundingClientRect();
        return { x: rect.left + 20, y: rect.bottom - 25 }; 
    }

    class Particle {
        constructor(x, y, isHeavy) {
            this.x = x;
            this.y = y;
            this.size = isHeavy ? Math.random() * 40 + 40 : Math.random() * 15 + 15;
            this.speedX = isHeavy ? (Math.random() * -8 - 2) : (Math.random() * -3 - 1);
            this.speedY = (Math.random() * 2 - 1);
            
            // DARK MODE SMOKE: Deep dark greys
            const colorVal = Math.floor(Math.random() * 25 + 15); 
            this.color = `${colorVal}, ${colorVal}, ${colorVal}`;
            this.life = 0.8; 
            this.decay = isHeavy ? 0.015 : 0.02; 
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.size += 0.5; 
            this.life -= this.decay;
        }
        draw() {
            ctx.fillStyle = `rgba(${this.color}, ${Math.max(0, this.life)})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const pos = getExhaustPosition();
        
        if (pos.x > 0 && pos.x < window.innerWidth + 100) {
            if (!isSpeeding && Math.random() > 0.5) {
                particles.push(new Particle(pos.x, pos.y, false)); 
            } else if (isSpeeding) {
                for (let i = 0; i < 5; i++) {
                    particles.push(new Particle(pos.x, pos.y, true)); 
                }
            }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].life <= 0) {
                particles.splice(i, 1);
            }
        }
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();


    // --- 2. GSAP CINEMATIC TIMELINE ---
    const tl = gsap.timeline();

    tl.to(car, { 
        left: "35%", 
        duration: 2, 
        ease: "power2.out" 
    })
    .to({}, { duration: 1.5 })
    .add(() => {
        isSpeeding = true;
        document.getElementById('scene').classList.add('fast-road');
    })
    .to(car, { 
        left: "150%", 
        y: -5,
        rotation: -3,
        duration: 0.8, 
        ease: "power2.in" 
    })
    .to("#smoke-screen", {
        opacity: 1,
        duration: 0.8,
        ease: "power1.inOut"
    }, "-=0.2") 
    .to("#title", {
        opacity: 1,
        scale: 1.15,
        filter: "blur(0px)",
        duration: 2.5,
        ease: "power3.out"
    })
    .to("#enter-prompt", {
        opacity: 1,
        duration: 1,
        ease: "power2.inOut",
        yoyo: true, 
        repeat: -1 
    });

    // --- PAGE REDIRECT LOGIC ---
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            gsap.to("body", { 
                opacity: 0, 
                duration: 0.6, 
                onComplete: () => { window.location.href = "../SignIn/signin.html"; }
            });
        }
    });

    document.body.addEventListener('click', () => {
        gsap.to("body", { 
            opacity: 0, 
            duration: 0.6, 
            onComplete: () => { window.location.href = "../SignIn/signin.html"; }
        });
    });
});