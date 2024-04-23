const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let lines = [];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(line => {
        line.x += line.vx;
        line.y += line.vy;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x + line.length * Math.cos(line.angle), line.y + line.length * Math.sin(line.angle));
        ctx.strokeStyle = `rgba(0, 0, 0, ${line.opacity})`; // Use opacity for line color
        ctx.stroke();
        if (line.x < 0 || line.x > canvas.width || line.y < 0 || line.y > canvas.height) {
            line.x = Math.random() * canvas.width;
            line.y = Math.random() * canvas.height;
            line.vx = (Math.random() - 0.5) * 0.045; // Slower animation
            line.vy = (Math.random() - 0.5) * 0.045; // Slower animation
            line.opacity = 0; // Reset opacity when line moves out of canvas
        }
        if (line.opacity < line.maxOpacity) {
            line.opacity += 0.0003; // Increase opacity very gradually
        }
    });
    requestAnimationFrame(animate);
}

function init() {
    for (let i = 0; i < 100; i++) {
        lines.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            length: Math.random() * 100,
            angle: Math.random() * Math.PI * 2,
            vx: (Math.random() - 0.5) * 0.045, // Slower animation
            vy: (Math.random() - 0.5) * 0.045,  // Slower animation
            opacity: 0, // Initial opacity is 0
            maxOpacity: Math.random() * 0.5 // Maximum opacity
        });
    }
    animate();
}

window.addEventListener('resize', resize);
resize();
init();