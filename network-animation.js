// --- Animated Network Graph for Hero Section ---
// --- 1. ADD THIS SEEDABLE RANDOM NUMBER FUNCTION ---
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
// --- END OF NEW FUNCTION ---

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) {
        console.error("Canvas element #network-canvas not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
    let nodes = [];
    let edges = [];
    const numNodes = 40;
    const maxEdgeDistance = 200;
    const particleSpeed = 0.5;
    let particles = [];
    const numParticles = 20;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Node {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = Math.random() * 2 + 1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.2)'; // UPDATED: Dark color for nodes
            ctx.fill();
        }
    }

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            if (edges.length === 0) return;
            const startEdge = edges[Math.floor(Math.random() * edges.length)];
            this.startNode = startEdge.start;
            this.endNode = startEdge.end;
            this.x = this.startNode.x;
            this.y = this.startNode.y;
            this.progress = 0;
        }

        update() {
            if (!this.startNode) return;
            const dx = this.endNode.x - this.startNode.x;
            const dy = this.endNode.y - this.startNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance === 0) {
                this.reset();
                return;
            }
            
            const travel = particleSpeed / distance;
            this.progress += travel;

            if (this.progress >= 1) {
                this.reset();
            } else {
                this.x = this.startNode.x + dx * this.progress;
                this.y = this.startNode.y + dy * this.progress;
            }
        }
        
        draw() {
			if (!this.startNode) return;
			ctx.beginPath();
			ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
			// CHANGED hex to rgba for transparency
			ctx.fillStyle = 'rgba(56, 189, 248, 0.7)'; 
			ctx.fill();
			}
    }

    function createNetwork() {
    nodes = [];
    edges = [];
    particles = [];

    // --- 2. CHOOSE YOUR SEED HERE ---
    // Change this number to get a new layout. Try 123, 1989, 42, etc.
    const seed = 12345; 
    const random = mulberry32(seed); // This creates our repeatable random generator

    // --- 3. USE `random()` INSTEAD OF `Math.random()` ---
    for (let i = 0; i < numNodes; i++) {
        // We use our new `random()` function here for predictable positions
        nodes.push(new Node(random() * canvas.width, random() * canvas.height));
    }

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < maxEdgeDistance) {
                edges.push({ start: nodes[i], end: nodes[j] });
            }
        }
    }
    
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        nodes.forEach(node => node.draw());
        
        edges.forEach(edge => {
            ctx.beginPath();
            ctx.moveTo(edge.start.x, edge.start.y);
            ctx.lineTo(edge.end.x, edge.end.y);
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.05)'; // UPDATED: Dark color for edges
            ctx.stroke();
        });

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        createNetwork();
    });

    resizeCanvas();
    createNetwork();
    animate();
});