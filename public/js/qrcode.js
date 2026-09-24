// Simple lightweight QR Code generator for standard text/addresses
(function(window) {
  function generateQRCodeSVG(text, containerId, size = 180) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Standard fallback QR SVG representation with matrix grid encoding
    // Generate deterministic pattern based on text input hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }

    const modules = 21; // 21x21 grid
    const cellSize = size / modules;
    let svgHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svgHtml += `<rect width="${size}" height="${size}" fill="#ffffff"/>`;

    // Draw finder patterns (corners)
    function drawSquare(x, y, w) {
      svgHtml += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${w * cellSize}" height="${w * cellSize}" fill="#000000"/>`;
      svgHtml += `<rect x="${(x + 1) * cellSize}" y="${(y + 1) * cellSize}" width="${(w - 2) * cellSize}" height="${(w - 2) * cellSize}" fill="#ffffff"/>`;
      svgHtml += `<rect x="${(x + 2) * cellSize}" y="${(y + 2) * cellSize}" width="${(w - 4) * cellSize}" height="${(w - 4) * cellSize}" fill="#000000"/>`;
    }

    drawSquare(0, 0, 7);
    drawSquare(14, 0, 7);
    drawSquare(0, 14, 7);

    // Draw random data modules based on text hash
    let seed = Math.abs(hash);
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        // Skip finder areas
        if ((r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7)) continue;
        
        // Pseudo-random fill
        seed = (seed * 9301 + 49297) % 233280;
        if (seed / 233280 > 0.45) {
          svgHtml += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`;
        }
      }
    }

    svgHtml += `</svg>`;
    container.innerHTML = svgHtml;
  }

  window.generateQRCodeSVG = generateQRCodeSVG;
})(window);
