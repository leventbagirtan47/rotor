/* Rotor – animasyonlu arka plan: akan ışık şeritleri, süzülen ışık noktaları ve imleci izleyen parlama */
(() => {
  const c = document.getElementById('bg'), x = c.getContext('2d');
  const cols = ['46,123,255', '155,92,255', '255,46,147', '255,122,26'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rm = () => reduce || !!document.documentElement.dataset.rm;
  let W, H, D, t = 0, mx = .5, my = .5, tx = .5, ty = .5;
  const dots = Array.from({ length: 44 }, (_, i) => ({
    x: Math.random(), y: Math.random(), r: 2 + Math.random() * 5, s: .008 + Math.random() * .03,
    c: cols[i % 4], z: .3 + Math.random() * .7, ph: Math.random() * 6.28 }));
  function size() { D = Math.min(devicePixelRatio || 1, 2); W = c.width = innerWidth * D; H = c.height = innerHeight * D; }
  addEventListener('resize', size); size();
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth; ty = e.clientY / innerHeight; });
  function ribbon(i, light) {
    const base = H * (.22 + .2 * i), amp = H * (.07 + .02 * i), col = cols[i];
    for (const [w, a] of [[170, .035], [110, .05], [60, .07], [20, .13]]) {
      x.beginPath();
      for (let px = 0; px <= W; px += 14 * D) {
        const u = px / W;
        const y = base + Math.sin(u * 4.2 + t * (1 + i * .35) + i * 2) * amp + Math.sin(u * 9 - t * 1.7 + i) * amp * .3 + (my - .5) * H * .08 * (i + 1) / 3;
        px ? x.lineTo(px, y) : x.moveTo(px, y);
      }
      x.lineWidth = w * D; x.lineCap = 'round';
      x.strokeStyle = `rgba(${col},${light ? a * .5 : a})`; x.stroke();
    }
  }
  function frame() {
    if (document.hidden) return requestAnimationFrame(frame);
    const light = document.documentElement.dataset.t === 'light';
    t += rm() ? 0 : .0045; mx += (tx - mx) * .04; my += (ty - my) * .04;
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = light ? '#eef0f7' : '#05060b'; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = light ? 'source-over' : 'lighter';
    for (let i = 0; i < 3; i++) ribbon(i, light);
    for (const d of dots) {
      d.y -= rm() ? 0 : d.s * .004; if (d.y < -.05) { d.y = 1.05; d.x = Math.random(); }
      const px = (d.x + (mx - .5) * .05 * d.z) * W, py = d.y * H, r = d.r * d.z * D * (1 + .25 * Math.sin(t * 6 + d.ph));
      const g = x.createRadialGradient(px, py, 0, px, py, r * 4);
      g.addColorStop(0, `rgba(${d.c},${light ? .3 : .55})`); g.addColorStop(1, `rgba(${d.c},0)`);
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r * 4, 0, 6.283); x.fill();
    }
    const g = x.createRadialGradient(mx * W, my * H, 0, mx * W, my * H, 260 * D);
    g.addColorStop(0, `rgba(155,92,255,${light ? .1 : .16})`); g.addColorStop(1, 'rgba(155,92,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    requestAnimationFrame(frame);
  }
  frame();
})();
