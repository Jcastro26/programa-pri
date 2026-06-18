// =======================================================
// AVISOS PROPIOS DE PROGRAMA-PRI (reemplazo de alert/confirm)
// Incluir con: <script src="pri-modal.js"></script>
// Uso: mostrarAvisoPRI("Título", "Mensaje", "✅")
// =======================================================
window.mostrarAvisoPRI = function (titulo, msg, icono) {
    icono = icono || '⚠️';
    let root = document.getElementById('pri-modal-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'pri-modal-root';
        document.body.appendChild(root);
    }
    root.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(2,26,54,0.78);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(4px);"
         onclick="if(event.target===this) this.remove()">
      <div style="background:#062040;border:1px solid rgba(255,94,0,0.35);border-radius:12px;max-width:380px;width:90%;padding:1.75rem;box-shadow:0 12px 40px rgba(0,0,0,0.5);text-align:center;font-family:'Inter',sans-serif;">
        <div style="height:3px;width:40px;margin:0 auto 1rem;background:linear-gradient(90deg,#ff5e00,#ffd700);border-radius:2px;"></div>
        <div style="font-size:1.8rem;margin-bottom:0.5rem;">${icono}</div>
        <div style="font-family:'Montserrat',sans-serif;font-weight:900;color:#f0f4f8;font-size:1.05rem;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:1px;">${titulo}</div>
        <div style="color:rgba(240,244,248,0.75);font-size:0.85rem;line-height:1.55;margin-bottom:1.25rem;">${msg}</div>
        <button onclick="this.closest('div[style*=fixed]').remove()" style="background:#ff5e00;color:#fff;border:none;font-weight:800;padding:0.65rem 1.5rem;border-radius:6px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:0.8rem;letter-spacing:1px;text-transform:uppercase;">Entendido</button>
      </div>
    </div>`;
};

// Versión con confirmación (Sí/No) que devuelve una Promise<boolean>
window.confirmarPRI = function (titulo, msg, icono) {
    icono = icono || '❓';
    return new Promise((resolve) => {
        let root = document.getElementById('pri-modal-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'pri-modal-root';
            document.body.appendChild(root);
        }
        root.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(2,26,54,0.78);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(4px);">
          <div style="background:#062040;border:1px solid rgba(255,94,0,0.35);border-radius:12px;max-width:380px;width:90%;padding:1.75rem;box-shadow:0 12px 40px rgba(0,0,0,0.5);text-align:center;font-family:'Inter',sans-serif;">
            <div style="height:3px;width:40px;margin:0 auto 1rem;background:linear-gradient(90deg,#ff5e00,#ffd700);border-radius:2px;"></div>
            <div style="font-size:1.8rem;margin-bottom:0.5rem;">${icono}</div>
            <div style="font-family:'Montserrat',sans-serif;font-weight:900;color:#f0f4f8;font-size:1.05rem;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:1px;">${titulo}</div>
            <div style="color:rgba(240,244,248,0.75);font-size:0.85rem;line-height:1.55;margin-bottom:1.25rem;">${msg}</div>
            <div style="display:flex;gap:0.6rem;justify-content:center;">
              <button id="pri-confirm-no" style="background:rgba(255,255,255,0.08);color:#f0f4f8;border:none;font-weight:800;padding:0.65rem 1.4rem;border-radius:6px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:0.8rem;letter-spacing:1px;text-transform:uppercase;">Cancelar</button>
              <button id="pri-confirm-yes" style="background:#ff5e00;color:#fff;border:none;font-weight:800;padding:0.65rem 1.4rem;border-radius:6px;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:0.8rem;letter-spacing:1px;text-transform:uppercase;">Confirmar</button>
            </div>
          </div>
        </div>`;
        document.getElementById('pri-confirm-yes').onclick = () => { root.innerHTML = ''; resolve(true); };
        document.getElementById('pri-confirm-no').onclick = () => { root.innerHTML = ''; resolve(false); };
    });
};

// Pequeño "toast" para confirmaciones rápidas no bloqueantes
window.toastPRI = function (msg, icono) {
    icono = icono || '✅';
    let t = document.createElement('div');
    t.style.cssText = "position:fixed;bottom:24px;right:24px;background:#062040;border-left:4px solid #ff5e00;color:#f0f4f8;padding:0.9rem 1.25rem;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.4);font-family:'Inter',sans-serif;font-size:0.85rem;z-index:99999;display:flex;gap:0.6rem;align-items:center;max-width:320px;animation:priToastIn 0.25s ease;";
    t.innerHTML = `<span style="font-size:1.1rem;">${icono}</span><span>${msg}</span>`;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 3500);
};
const styleToast = document.createElement('style');
styleToast.textContent = `@keyframes priToastIn { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }`;
document.head.appendChild(styleToast);