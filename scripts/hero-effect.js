/*
 * hero-effect.js — the home page name, rendered through a small WebGL pass.
 *
 * Inlined into index.html by build-site.mjs. No dependencies.
 *
 * The h1 keeps its real text (for selection, screen readers and the link to the
 * cover scroll) and is only made transparent once a GL context actually exists,
 * so without WebGL the page looks exactly as it does now. The glyphs are drawn
 * to a 2D canvas in the page's own font, uploaded as a texture, and sampled
 * through a slow flow field, a lens that wanders on its own, and a second lens
 * under the cursor. The first two run unattended, so the name is never still.
 *
 * Cargo re-renders pages client-side, so the effect re-mounts whenever a new h1
 * appears, and stops itself when its own h1 leaves the document.
 */
(function () {
	var PAD = 0.09; // texture margin, so the warp cannot clip the glyph edges
	var MAX_DPR = 2;

	var VERT = [
		"attribute vec2 aPos;",
		"varying vec2 vUv;",
		"void main() {",
		"	vUv = aPos * 0.5 + 0.5;",
		"	gl_Position = vec4(aPos, 0.0, 1.0);",
		"}"
	].join("\n");

	var FRAG = [
		"precision highp float;",
		"varying vec2 vUv;",
		"uniform sampler2D uTex;",
		"uniform vec3 uColor;",
		"uniform vec2 uMouse;",
		"uniform float uTime;",
		"uniform float uAspect;",
		"uniform float uAmp;",
		"uniform float uSplit;",
		"uniform float uPointer;",
		"uniform float uDrift;",
		"uniform float uAlpha;",

		"float hash(vec2 p) {",
		"	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);",
		"}",

		"float noise(vec2 p) {",
		"	vec2 i = floor(p);",
		"	vec2 f = fract(p);",
		"	vec2 u = f * f * (3.0 - 2.0 * f);",
		"	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),",
		"		mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);",
		"}",

		"void main() {",
		"	vec2 uv = vUv;",
		"	vec2 p = vec2(uv.x * uAspect, uv.y);",

		// Slow drifting flow field — the ambient shimmer.
		"	float nx = noise(p * 2.6 + vec2(uTime * 0.022, uTime * 0.016));",
		"	float ny = noise(p * 2.6 + vec2(uTime * -0.020, uTime * 0.013) + 37.0);",
		"	vec2 flow = (vec2(nx, ny) - 0.5) * uAmp;",

		// Soft lens that follows the pointer.
		"	vec2 d = vec2((uv.x - uMouse.x) * uAspect, uv.y - uMouse.y);",
		"	float lens = exp(-dot(d, d) * 16.0) * uPointer;",
		"	flow += normalize(d + vec2(1e-5)) * lens * uAmp * 2.6;",

		/*
		 * A second lens that wanders on its own, so the name keeps breathing
		 * with no cursor on the page. Broader and weaker than the pointer's,
		 * on a Lissajous path of roughly one and a half minutes, which is slow
		 * enough that you notice it has moved rather than watching it move.
		 */
		"	vec2 ac = vec2(0.5 + 0.30 * sin(uTime * 0.11), 0.5 + 0.22 * cos(uTime * 0.083));",
		"	vec2 ad = vec2((uv.x - ac.x) * uAspect, uv.y - ac.y);",
		"	float drift = exp(-dot(ad, ad) * 9.0) * uDrift;",
		"	flow += normalize(ad + vec2(1e-5)) * drift * uAmp * 1.5;",

		"	vec2 w = uv + flow;",
		"	float split = uSplit * (0.35 + lens * 1.4 + drift * 0.9);",
		"	float ar = texture2D(uTex, w + vec2(split, 0.0)).a;",
		"	float ag = texture2D(uTex, w).a;",
		"	float ab = texture2D(uTex, w - vec2(split, 0.0)).a;",

		// Premultiplied output: per-channel alpha gives the chromatic fringe.
		// uAlpha carries the h1's own colour alpha, so the name keeps the weight
		// it has everywhere else on the site.
		"	float a = max(max(ar, ag), ab) * uAlpha;",
		"	gl_FragColor = vec4(uColor.r * ar * uAlpha, uColor.g * ag * uAlpha, uColor.b * ab * uAlpha, a);",
		"}"
	].join("\n");

	function compile(gl, type, src) {
		var sh = gl.createShader(type);
		gl.shaderSource(sh, src);
		gl.compileShader(sh);
		if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
		return sh;
	}

	function program(gl) {
		var vs = compile(gl, gl.VERTEX_SHADER, VERT);
		var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
		if (!vs || !fs) return null;
		var pr = gl.createProgram();
		gl.attachShader(pr, vs);
		gl.attachShader(pr, fs);
		gl.linkProgram(pr);
		if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
		return pr;
	}

	/** "rgba(255, 255, 255, 0.85)" -> [r, g, b, a] in 0..1 */
	function parseColor(value) {
		var m = /rgba?\(([^)]+)\)/.exec(value || "");
		if (!m) return [1, 1, 1, 1];
		var parts = m[1].split(",");
		return [
			parseFloat(parts[0]) / 255,
			parseFloat(parts[1]) / 255,
			parseFloat(parts[2]) / 255,
			parts.length > 3 ? parseFloat(parts[3]) : 1
		];
	}

	/** Draw the h1's own text, in its own font, into a 2D canvas. */
	function drawText(el, width, height, dpr) {
		var cs = getComputedStyle(el);
		var size = parseFloat(cs.fontSize);
		var canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(width * dpr));
		canvas.height = Math.max(1, Math.round(height * dpr));
		var ctx = canvas.getContext("2d");
		if (!ctx) return null;

		ctx.scale(dpr, dpr);
		ctx.font = cs.fontWeight + " " + size + "px " + cs.fontFamily;
		if ("letterSpacing" in ctx) ctx.letterSpacing = cs.letterSpacing;
		ctx.textAlign = "center";
		ctx.textBaseline = "alphabetic";
		ctx.fillStyle = "#fff";

		var text = (el.textContent || "").trim();
		var m = ctx.measureText(text);
		var ascent = m.actualBoundingBoxAscent || size * 0.75;
		var descent = m.actualBoundingBoxDescent || size * 0.25;
		// Centre the glyph box in the padded canvas.
		ctx.fillText(text, width / 2, height / 2 + (ascent - descent) / 2);
		return canvas;
	}

	function mount(el) {
		if (el.__heroGL) return;

		var canvas = document.createElement("canvas");
		var gl =
			canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true }) ||
			canvas.getContext("experimental-webgl");
		if (!gl) return; // no GL: leave the plain text alone

		var pr = program(gl);
		if (!pr) return;

		el.__heroGL = true;
		el.classList.add("hero-gl");
		canvas.className = "hero-gl-canvas";
		el.appendChild(canvas);

		gl.useProgram(pr);
		var buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		var aPos = gl.getAttribLocation(pr, "aPos");
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

		var u = {};
		[
			"uTex",
			"uColor",
			"uMouse",
			"uTime",
			"uAspect",
			"uAmp",
			"uSplit",
			"uPointer",
			"uDrift",
			"uAlpha"
		].forEach(function (name) {
			u[name] = gl.getUniformLocation(pr, name);
		});

		var tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		var width = 0;
		var height = 0;
		var aspect = 1;
		var ready = false;
		var visible = true;
		var mouse = [0.5, 0.5];
		var pointer = 0; // eased presence of the cursor
		var targetPointer = 0;
		var start = performance.now();

		function resize() {
			var rect = el.getBoundingClientRect();
			if (!rect.width || !rect.height) return;
			var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
			width = rect.width * (1 + PAD * 2);
			height = rect.height * (1 + PAD * 2);
			aspect = width / height;

			canvas.style.left = -rect.width * PAD + "px";
			canvas.style.top = -rect.height * PAD + "px";
			canvas.style.width = width + "px";
			canvas.style.height = height + "px";
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			gl.viewport(0, 0, canvas.width, canvas.height);

			var text = drawText(el, width, height, dpr);
			if (!text) return;
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, text);
			var color = parseColor(getComputedStyle(el).color);
			gl.uniform3fv(u.uColor, color.slice(0, 3));
			gl.uniform1f(u.uAlpha, color[3]);
			ready = true;
		}

		function frame(now) {
			if (!document.contains(el)) {
				// Cargo replaced the page: drop the context and stop.
				var lose = gl.getExtension("WEBGL_lose_context");
				if (lose) lose.loseContext();
				return;
			}
			requestAnimationFrame(frame);
			if (!ready || !visible) return;
			el.__heroFrames = (el.__heroFrames || 0) + 1; // handy when debugging

			pointer += (targetPointer - pointer) * 0.06;

			/*
			 * Scrolling away distorts the name the same way the cursor does, but
			 * across the whole wordmark. Measured against the title's own position
			 * rather than a viewport fraction: 0 with the page at rest, 1 once it
			 * has scrolled clear of the top edge, whatever the viewport height.
			 */
			var rect = el.getBoundingClientRect();
			var scrolled = window.scrollY || document.documentElement.scrollTop || 0;
			var travel = rect.bottom + scrolled; // the title's bottom in page space
			var exit = travel > 0 ? scrolled / travel : 0;
			exit = exit < 0 ? 0 : exit > 1 ? 1 : exit;
			exit = reduce ? 0 : Math.pow(exit, 1.6);

			gl.useProgram(pr);
			gl.uniform1f(u.uTime, reduce ? 0 : (now - start) / 1000);
			gl.uniform1f(u.uAspect, aspect);
			gl.uniform1f(u.uAmp, (reduce ? 0.0016 : 0.0042) * (1 + exit * 6));
			gl.uniform1f(u.uSplit, 0.0014 * (1 + exit * 4));
			gl.uniform1f(u.uPointer, reduce ? 0 : pointer);
			// Always on, cursor or not — the only thing that stills it is
			// prefers-reduced-motion.
			gl.uniform1f(u.uDrift, reduce ? 0 : 1);
			gl.uniform2f(u.uMouse, mouse[0], mouse[1]);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.uniform1i(u.uTex, 0);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		}

		window.addEventListener(
			"pointermove",
			function (event) {
				var rect = canvas.getBoundingClientRect();
				mouse[0] = (event.clientX - rect.left) / rect.width;
				mouse[1] = 1 - (event.clientY - rect.top) / rect.height;
				var near =
					event.clientX > rect.left - rect.width * 0.4 &&
					event.clientX < rect.right + rect.width * 0.4 &&
					event.clientY > rect.top - rect.height * 1.5 &&
					event.clientY < rect.bottom + rect.height * 1.5;
				targetPointer = near ? 1 : 0;
			},
			{ passive: true }
		);

		if (window.ResizeObserver) new ResizeObserver(resize).observe(el);
		window.addEventListener("resize", resize, { passive: true });
		if (window.IntersectionObserver) {
			new IntersectionObserver(function (entries) {
				visible = entries[0].isIntersecting;
			}).observe(el);
		}

		resize();
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
		requestAnimationFrame(frame);
	}

	function scan() {
		var el = document.querySelector(".content h1");
		if (el) mount(el);
	}

	if (window.MutationObserver) {
		new MutationObserver(scan).observe(document.documentElement, {
			childList: true,
			subtree: true
		});
	}
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", scan);
	} else {
		scan();
	}
})();
