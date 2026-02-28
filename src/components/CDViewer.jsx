import { useEffect, useRef } from 'react';

// Original CDViewer implementation from music.html (Renamed to CDViewerGL to avoid conflict)
class CDViewerGL {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl');

        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        this.rotation = 0;
        this.phase = Math.random() * Math.PI * 2;
        this.autoRotate = true;
        this.lastTime = Date.now();
        this.dragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.texture = null;
        this.backTexture = null;
        this.destroyed = false;

        this.setupShaders();
        this.setupGeometry();
        this.setupEventListeners();
        this.loadAssets();
        this.animate();
    }

    setupShaders() {
        const gl = this.gl;
        
        const vsSource = `
            attribute vec4 aPosition;
            attribute vec2 aTexCoord;
            attribute vec3 aNormal;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uNormalMatrix;
            varying vec2 vTexCoord;
            varying vec3 vNormal;
            varying vec3 vViewPos;
            
            void main() {
                vec4 viewPos = uModelViewMatrix * aPosition;
                gl_Position = uProjectionMatrix * viewPos;
                vTexCoord = aTexCoord;
                vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
                vViewPos = viewPos.xyz;
            }
        `;

        const fsSource = `
            precision highp float;
            varying vec2 vTexCoord;
            varying vec3 vNormal;
            varying vec3 vViewPos;
            uniform sampler2D uSampler;
            uniform sampler2D uBackSampler;
            uniform int uMaterial;
            uniform int uHasBack;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(-vViewPos);
                vec3 light1 = normalize(vec3(2.0, 3.0, 4.0));
                vec3 light2 = normalize(vec3(-1.5, 1.0, 2.0));
                float diff1 = max(dot(normal, light1), 0.0);
                float diff2 = max(dot(normal, light2), 0.0) * 0.5;
                vec3 halfDir1 = normalize(light1 + viewDir);
                float spec1 = pow(max(dot(normal, halfDir1), 0.0), 64.0);
                float ambient = 0.3;
                
                if (uMaterial == 0) {
                    vec4 tex = texture2D(uSampler, vTexCoord);
                    float light = ambient + diff1 * 0.65 + diff2 * 0.35;
                    gl_FragColor = vec4(tex.rgb * light, 1.0);
                } else if (uMaterial == 5) {
                    vec4 tex;
                    if (uHasBack == 1) {
                        tex = texture2D(uBackSampler, vTexCoord);
                    } else {
                        tex = texture2D(uSampler, vTexCoord);
                        tex.a = 1.0;
                    }
                    float light = ambient + diff1 * 0.65 + diff2 * 0.35;
                    gl_FragColor = vec4(tex.rgb * light, tex.a);
                } else if (uMaterial == 1) {
                    float ndotv = abs(dot(normal, viewDir));
                    float fresnel = pow(1.0 - ndotv, 4.0);
                    fresnel = mix(0.03, 0.25, fresnel);
                    vec3 plasticTint = vec3(0.88, 0.90, 0.92);
                    vec3 color = plasticTint * (ambient * 0.4 + diff1 * 0.25 + diff2 * 0.15);
                    color += vec3(1.0) * spec1 * 0.9;
                    gl_FragColor = vec4(color, 0.08 + fresnel);
                } else if (uMaterial == 2) {
                    float ndotv = abs(dot(normal, viewDir));
                    float fresnel = pow(1.0 - ndotv, 2.0);
                    vec3 color = vec3(0.08, 0.08, 0.1) * (ambient * 0.7 + diff1 * 0.4 + diff2 * 0.25);
                    color += vec3(1.0) * spec1 * 0.4;
                    gl_FragColor = vec4(color, 0.5 + fresnel * 0.3);
                } else {
                    float ndotv = abs(dot(normal, viewDir));
                    float fresnel = pow(1.0 - ndotv, 3.0);
                    vec3 color = vec3(0.9, 0.92, 0.94) * (ambient * 0.6 + diff1 * 0.3 + diff2 * 0.2);
                    color += vec3(1.0) * spec1 * 0.6;
                    gl_FragColor = vec4(color, 0.15 + fresnel * 0.25);
                }
            }
        `;

        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSource);
        gl.compileShader(vs);

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSource);
        gl.compileShader(fs);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        this.loc = {
            attr: {
                position: gl.getAttribLocation(this.program, 'aPosition'),
                texCoord: gl.getAttribLocation(this.program, 'aTexCoord'),
                normal: gl.getAttribLocation(this.program, 'aNormal'),
            },
            uni: {
                projection: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
                modelView: gl.getUniformLocation(this.program, 'uModelViewMatrix'),
                normalMat: gl.getUniformLocation(this.program, 'uNormalMatrix'),
                sampler: gl.getUniformLocation(this.program, 'uSampler'),
                backSampler: gl.getUniformLocation(this.program, 'uBackSampler'),
                material: gl.getUniformLocation(this.program, 'uMaterial'),
                hasBack: gl.getUniformLocation(this.program, 'uHasBack'),
            },
        };
    }

    setupGeometry() {
        const gl = this.gl;
        const w = 1.42, h = 1.25, d = 0.1, spineW = 0.14;

        const quad = (p, t, n, v1, v2, v3, v4, norm, tex = false) => {
            p.push(...v1, ...v2, ...v3, ...v1, ...v3, ...v4);
            if (tex) t.push(0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0);
            else for (let i = 0; i < 6; i++) t.push(0, 0);
            for (let i = 0; i < 6; i++) n.push(...norm);
        };

        const createGeometry = () => {
            const geoms = [];
            
            // Front booklet
            {
                const p = [], t = [], n = [];
                const z = d/2 - 0.02;
                quad(p, t, n,
                    [-w/2 + spineW + 0.015, -h/2 + 0.015, z],
                    [w/2 - 0.015, -h/2 + 0.015, z],
                    [w/2 - 0.015, h/2 - 0.015, z],
                    [-w/2 + spineW + 0.015, h/2 - 0.015, z],
                    [0, 0, 1], true);
                geoms.push({p, t, n, mat: 0});
            }
            
            // Back insert
            {
                const p = [], t = [], n = [];
                const z = -d/2 + 0.003;
                quad(p, t, n,
                    [w/2, -h/2, z],
                    [-w/2, -h/2, z],
                    [-w/2, h/2, z],
                    [w/2, h/2, z],
                    [0, 0, -1], true);
                geoms.push({p, t, n, mat: 5});
            }
            
            // Plastic front
            {
                const p = [], t = [], n = [];
                quad(p, t, n, [-w/2, -h/2, d/2], [w/2, -h/2, d/2], [w/2, h/2, d/2], [-w/2, h/2, d/2], [0, 0, 1]);
                geoms.push({p, t, n, mat: 1});
            }
            
            // Plastic back
            {
                const p = [], t = [], n = [];
                quad(p, t, n, [w/2, -h/2, -d/2], [-w/2, -h/2, -d/2], [-w/2, h/2, -d/2], [w/2, h/2, -d/2], [0, 0, -1]);
                geoms.push({p, t, n, mat: 1});
            }
            
            // Edges
            const edges = [
                {v: [[w/2, -h/2, d/2], [w/2, -h/2, -d/2], [w/2, h/2, -d/2], [w/2, h/2, d/2]], n: [1, 0, 0]},
                {v: [[-w/2, h/2, d/2], [w/2, h/2, d/2], [w/2, h/2, -d/2], [-w/2, h/2, -d/2]], n: [0, 1, 0]},
                {v: [[-w/2, -h/2, -d/2], [w/2, -h/2, -d/2], [w/2, -h/2, d/2], [-w/2, -h/2, d/2]], n: [0, -1, 0]},
                {v: [[-w/2, -h/2, -d/2], [-w/2, -h/2, d/2], [-w/2, h/2, d/2], [-w/2, h/2, -d/2]], n: [-1, 0, 0]},
            ];
            edges.forEach(e => {
                const p = [], t = [], n = [];
                quad(p, t, n, ...e.v, e.n);
                geoms.push({p, t, n, mat: 4});
            });
            
            return geoms.map(g => {
                const buffers = [g.p, g.t, g.n].map(data => {
                    const buf = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
                    return buf;
                });
                return {pos: buffers[0], tex: buffers[1], norm: buffers[2], count: g.p.length / 3, mat: g.mat};
            });
        };

        this.buffers = createGeometry();
    }

    setupEventListeners() {
        this.handleDown = (e) => {
            this.dragging = true;
            this.autoRotate = false;
            this.lastX = e.clientX;
        };

        this.handleMoveWrapper = (e) => {
            if (this.dragging) {
                this.rotation += (e.clientX - this.lastX) * 0.01;
                this.lastX = e.clientX;
                this.lastTime = Date.now();
                this.draw();
            }
        };

        this.handleUpWrapper = () => {
            if (this.dragging) {
                this.dragging = false;
                setTimeout(() => {
                    if (!this.dragging && !this.destroyed) {
                        this.autoRotate = true;
                        this.lastTime = Date.now();
                    }
                }, 2000);
            }
        };

        this.handleTouchStart = (e) => {
            e.preventDefault();
            this.dragging = true;
            this.autoRotate = false;
            this.lastX = e.touches[0].clientX;
        };

        this.handleTouchMove = (e) => {
            e.preventDefault();
            if (this.dragging) {
                this.rotation += (e.touches[0].clientX - this.lastX) * 0.01;
                this.lastX = e.touches[0].clientX;
                this.lastTime = Date.now();
                this.draw();
            }
        };

        this.handleTouchEnd = (e) => {
            e.preventDefault();
            this.dragging = false;
            setTimeout(() => {
                if (!this.dragging && !this.destroyed) {
                    this.autoRotate = true;
                    this.lastTime = Date.now();
                }
            }, 2000);
        };

        // Mouse
        this.canvas.addEventListener('mousedown', this.handleDown);
        window.addEventListener('mousemove', this.handleMoveWrapper); 
        window.addEventListener('mouseup', this.handleUpWrapper);

        // Touch
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    }

    loadAssets() {
        const imagePath = this.canvas.dataset.image;
        const tracks = this.canvas.dataset.tracks;

        if (imagePath) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                if(this.destroyed) return;
                this.texture = this.loadTexture(img);
                this.draw();
            };
            img.src = imagePath;
        }

        if (tracks) {
            this.createBackTexture(tracks);
        }

        this.draw();
    }

    loadTexture(img) {
        const gl = this.gl;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return tex;
    }

    createBackTexture(text) {
        const c = document.createElement('canvas');
        c.width = c.height = 512;
        const ctx = c.getContext('2d');
        
        ctx.clearRect(0, 0, 512, 512);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 512, 512);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.font = '24px Arial';
        const lines = text.split('\n');
        lines.forEach((line, i) => {
            if (line.trim()) ctx.fillText(line.trim(), 50, 50 + i * 32);
        });
        
        const img = new Image();
        img.onload = () => {
            if(this.destroyed) return;
            this.backTexture = this.loadTexture(img);
            this.draw();
        };
        img.src = c.toDataURL();
    }

    perspective(fov, aspect, near, far) {
        const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
        return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
    }

    mat4() { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }

    translate(m, v) {
        const out = [...m];
        out[12] = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12];
        out[13] = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13];
        out[14] = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14];
        return out;
    }

    rotateY(m, a) {
        const s = Math.sin(a), c = Math.cos(a);
        const out = [...m];
        out[0] = m[0] * c - m[8] * s;
        out[1] = m[1] * c - m[9] * s;
        out[2] = m[2] * c - m[10] * s;
        out[8] = m[0] * s + m[8] * c;
        out[9] = m[1] * s + m[9] * c;
        out[10] = m[2] * s + m[10] * c;
        return out;
    }

    invert(m) {
        const a = m, out = [], det = a[0] * (a[5] * a[10] - a[6] * a[9]) - a[1] * (a[4] * a[10] - a[6] * a[8]) + a[2] * (a[4] * a[9] - a[5] * a[8]);
        const invDet = 1 / det;
        out[0] = (a[5] * a[10] - a[6] * a[9]) * invDet;
        out[1] = -(a[1] * a[10] - a[2] * a[9]) * invDet;
        out[2] = (a[1] * a[6] - a[2] * a[5]) * invDet;
        out[4] = -(a[4] * a[10] - a[6] * a[8]) * invDet;
        out[5] = (a[0] * a[10] - a[2] * a[8]) * invDet;
        out[6] = -(a[0] * a[6] - a[2] * a[4]) * invDet;
        out[8] = (a[4] * a[9] - a[5] * a[8]) * invDet;
        out[9] = -(a[0] * a[9] - a[1] * a[8]) * invDet;
        out[10] = (a[0] * a[5] - a[1] * a[4]) * invDet;
        return [out[0], out[1], out[2], 0, out[4], out[5], out[6], 0, out[8], out[9], out[10], 0, 0, 0, 0, 1];
    }

    transpose(m) {
        return [m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14], m[3], m[7], m[11], m[15]];
    }

    draw() {
        if(this.destroyed) return;
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const proj = this.perspective(35 * Math.PI / 180, this.canvas.width / this.canvas.height, 0.1, 100);
        const mv = this.rotateY(this.translate(this.mat4(), [0, 0, -2.8]), this.rotation);
        const norm = this.transpose(this.invert(mv));

        gl.useProgram(this.program);
        gl.uniformMatrix4fv(this.loc.uni.projection, false, proj);
        gl.uniformMatrix4fv(this.loc.uni.modelView, false, mv);
        gl.uniformMatrix4fv(this.loc.uni.normalMat, false, norm);
        gl.uniform1i(this.loc.uni.hasBack, this.backTexture ? 1 : 0);

        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.loc.uni.sampler, 0);
        }
        if (this.backTexture) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.backTexture);
            gl.uniform1i(this.loc.uni.backSampler, 1);
        }

        // Helper to draw
        const drawBufs = (transparent) => {
            this.buffers.forEach(b => {
                const isTransparent = (b.mat === 1 || b.mat === 4 || (b.mat === 5 && this.backTexture));
                if (isTransparent === transparent) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, b.pos);
                    gl.vertexAttribPointer(this.loc.attr.position, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(this.loc.attr.position);
                    gl.bindBuffer(gl.ARRAY_BUFFER, b.tex);
                    gl.vertexAttribPointer(this.loc.attr.texCoord, 2, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(this.loc.attr.texCoord);
                    gl.bindBuffer(gl.ARRAY_BUFFER, b.norm);
                    gl.vertexAttribPointer(this.loc.attr.normal, 3, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(this.loc.attr.normal);
                    gl.uniform1i(this.loc.uni.material, b.mat);
                    gl.drawArrays(gl.TRIANGLES, 0, b.count);
                }
            });
        };

        drawBufs(false); // Opaque
        gl.depthMask(false);
        drawBufs(true); // Transparent
        gl.depthMask(true);
    }

    animate() {
        if(this.destroyed) return;
        if (this.autoRotate) {
            const time = Date.now() * 0.001;
            const targetRotation = Math.sin(time + this.phase) * 0.5;
            let diff = targetRotation - this.rotation;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.rotation += diff * 0.05;
            this.draw();
        }
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.destroyed = true;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        
        // Remove event listeners
        window.removeEventListener('mousemove', this.handleMoveWrapper);
        window.removeEventListener('mouseup', this.handleUpWrapper);

        // Basic GL cleanup could go here (delete buffers, textures, program)
        const gl = this.gl;
        if(this.program) gl.deleteProgram(this.program);
        if(this.texture) gl.deleteTexture(this.texture);
        if(this.backTexture) gl.deleteTexture(this.backTexture);
        if (this.buffers) {
            this.buffers.forEach(b => {
                 gl.deleteBuffer(b.pos);
                 gl.deleteBuffer(b.tex);
                 gl.deleteBuffer(b.norm);
            });
        }
    }
}

// Fixed aspect ratio matching the original music.html (700:525 = 4:3)
const CD_ASPECT_RATIO = 700 / 525;

const CDViewer = ({ image, tracks }) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const viewerRef = useRef(null);

    useEffect(() => {
        const sizeCanvas = () => {
            if (!containerRef.current || !canvasRef.current) return;
            const container = containerRef.current.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            // Fit canvas within container while preserving the CD aspect ratio
            let w = container.width;
            let h = container.height;

            if (w / h > CD_ASPECT_RATIO) {
                // Container is wider than needed — constrain by height
                w = h * CD_ASPECT_RATIO;
            } else {
                // Container is taller than needed — constrain by width
                h = w / CD_ASPECT_RATIO;
            }

            canvasRef.current.style.width = w + 'px';
            canvasRef.current.style.height = h + 'px';
            canvasRef.current.width = Math.round(w * dpr);
            canvasRef.current.height = Math.round(h * dpr);
        };

        const initViewer = () => {
            if (canvasRef.current && !viewerRef.current) {
                if (image) canvasRef.current.dataset.image = image;
                if (tracks) canvasRef.current.dataset.tracks = tracks;

                sizeCanvas();
                viewerRef.current = new CDViewerGL(canvasRef.current);
            }
        };

        // Small delay to ensure layout is computed
        const timer = setTimeout(initViewer, 100);

        const handleResize = () => {
            if (canvasRef.current && viewerRef.current) {
                sizeCanvas();
                viewerRef.current.draw();
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            clearTimeout(timer);
            resizeObserver.disconnect();
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, [image, tracks]);

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center">
            <canvas 
                ref={canvasRef} 
                className="cursor-grab active:cursor-grabbing touch-none"
            />
        </div>
    );
};

export default CDViewer;
