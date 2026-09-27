import * as THREE from 'three';

const symbols = '_@/+-><?[]{}:$%&!';

function splitThaiGraphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });
    return [...segmenter.segment(text)].map(s => s.segment);
  }
  return text.split('');
}

/**
 * Computes exact, immutable horizontal slot coordinates for every grapheme cluster in the text.
 * Guarantees that decoding characters never cause layout jitter, shift, or bunching.
 */
export function computeFixedTextLayout(ctx, text, options = {}, effectiveFontSize = null) {
  const {
    width = 2048,
    height = 512,
    fontSize = 110,
    fontWeight = '400',
    fontFamily = '"FC Mee Sakul", "Makcasa", system-ui, sans-serif',
    align = 'center',
    letterSpacing = '0.04em'
  } = options;

  let fSize = effectiveFontSize || fontSize;
  ctx.font = `${fontWeight} ${fSize}px ${fontFamily}`;
  if (letterSpacing && 'letterSpacing' in ctx) {
    ctx.letterSpacing = letterSpacing;
  }

  // Auto-fit safety: ensure text never clips canvas borders
  const maxAllowedWidth = width - 160;
  let measuredWidth = ctx.measureText(text).width;
  if (!effectiveFontSize && measuredWidth > maxAllowedWidth) {
    const scaleFactor = maxAllowedWidth / measuredWidth;
    fSize = Math.floor(fSize * scaleFactor);
    ctx.font = `${fontWeight} ${fSize}px ${fontFamily}`;
    measuredWidth = ctx.measureText(text).width;
  }

  const clusters = splitThaiGraphemes(text);
  const totalWidth = measuredWidth;

  let startX = 80;
  if (align === 'center') {
    startX = (width - totalWidth) / 2;
  } else if (align === 'right') {
    startX = width - 80 - totalWidth;
  }

  const slots = [];
  for (let i = 0; i < clusters.length; i++) {
    const prefixWidth = ctx.measureText(clusters.slice(0, i).join('')).width;
    const nextPrefixWidth = ctx.measureText(clusters.slice(0, i + 1).join('')).width;
    const charWidth = Math.max(0, nextPrefixWidth - prefixWidth);
    const x = startX + prefixWidth;
    slots.push({
      index: i,
      char: clusters[i],
      isSpace: clusters[i] === ' ' || clusters[i] === '\t',
      x,
      width: charWidth,
      centerX: x + charWidth / 2
    });
  }

  return {
    text,
    clusters,
    totalWidth,
    startX,
    fontSize: fSize,
    y: height / 2,
    slots
  };
}

/**
 * Creates a high-resolution CanvasTexture for Thai typography.
 * Uses native browser text shaping to ensure 100% correct Thai diacritics and tone marks.
 */
export function createThaiTextTexture(text, options = {}) {
  const {
    width = 2048,
    height = 512,
    fontSize = 110,
    fontFamily = '"FC Mee Sakul", "Makcasa", system-ui, sans-serif',
    color = '#F1EFEA',
    fontWeight = '400',
    letterSpacing = '0.04em',
    align = 'center',
    glowColor = '#69358A',
    glowBlur = 0
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);

  // Auto-fit safety: ensure text never clips canvas borders
  const maxAllowedWidth = width - 160;
  let effectiveFontSize = fontSize;
  ctx.font = `${fontWeight} ${effectiveFontSize}px ${fontFamily}`;
  if (letterSpacing && 'letterSpacing' in ctx) {
    ctx.letterSpacing = letterSpacing;
  }
  let measuredWidth = ctx.measureText(text).width;
  if (measuredWidth > maxAllowedWidth) {
    const scaleFactor = maxAllowedWidth / measuredWidth;
    effectiveFontSize = Math.floor(effectiveFontSize * scaleFactor);
    ctx.font = `${fontWeight} ${effectiveFontSize}px ${fontFamily}`;
    measuredWidth = ctx.measureText(text).width;
  }

  if (glowBlur > 0) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;
  }

  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';

  const x = align === 'center' ? (width - measuredWidth) / 2 : align === 'left' ? 80 : width - 80 - measuredWidth;
  const y = height / 2;

  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  return { texture, canvas, ctx, width, height, effectiveFontSize };
}

/**
 * Creates a 3D Mesh Plane holding Thai typography in the world.
 */
export function createTextPlane(text, options = {}) {
  const {
    planeWidth = 14,
    planeHeight = 3.5,
    textureWidth = 2048,
    textureHeight = 512,
    fontSize = 110,
    fontWeight = '400',
    fontFamily = '"FC Mee Sakul", "Makcasa", system-ui, sans-serif',
    color = '#F1EFEA',
    isHero = false,
    ...rest
  } = options;

  const texData = createThaiTextTexture(text, {
    width: textureWidth,
    height: textureHeight,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    ...rest
  });

  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 1, 1);
  const material = new THREE.MeshBasicMaterial({
    map: texData.texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = {
    originalText: text,
    texData,
    options: {
      fontSize,
      fontWeight,
      fontFamily,
      color,
      planeWidth,
      planeHeight,
      textureWidth,
      textureHeight,
      ...rest
    },
    baseY: 0,
    baseZ: 0
  };

  return mesh;
}

/**
 * Fixed-Position text scramble update.
 * Anchors each glyph to its permanent horizontal coordinate calculated from the final layout.
 * Result: 100% stable, zero jumping, zero shifting left/right, and authentic in-place decode.
 */
export function updateTextScramble(mesh, progress, step = 0) {
  if (!mesh || !mesh.userData || !mesh.userData.texData) return;
  const { originalText, texData, options } = mesh.userData;
  const { ctx, width, height } = texData;
  const {
    fontSize = 110,
    fontWeight = '400',
    fontFamily = '"FC Mee Sakul", "Makcasa", system-ui, sans-serif',
    color = '#F1EFEA',
    letterSpacing = '0.04em'
  } = options;

  if (!mesh.userData.layoutData) {
    mesh.userData.layoutData = computeFixedTextLayout(ctx, originalText, options, texData.effectiveFontSize);
  }
  const layout = mesh.userData.layoutData;
  const totalSlots = layout.slots.length;
  const resolvedCount = progress >= 0.98 ? totalSlots : Math.floor(progress * totalSlots);

  ctx.clearRect(0, 0, width, height);
  ctx.textBaseline = 'middle';
  ctx.font = `${fontWeight} ${layout.fontSize}px ${fontFamily}`;
  if (letterSpacing && 'letterSpacing' in ctx) {
    ctx.letterSpacing = letterSpacing;
  }

  // 1. Draw resolved portion as a continuous, perfectly kerned string anchored at fixed startX
  if (resolvedCount > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = color;
    const resolvedString = layout.clusters.slice(0, resolvedCount).join('');
    ctx.fillText(resolvedString, layout.startX, layout.y);
  }

  // 2. Draw scrambling glyphs in their exact predetermined slots (fixed centerX)
  if (resolvedCount < totalSlots) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#D4C0E5'; // Soft luminous violet-silver for decoding characters
    for (let i = resolvedCount; i < totalSlots; i++) {
      const slot = layout.slots[i];
      if (!slot.isSpace) {
        const sym = symbols[(i * 7 + step) % symbols.length];
        ctx.fillText(sym, slot.centerX, layout.y);
      }
    }
  }

  texData.texture.needsUpdate = true;
}

/**
 * Autonomous real-time digital decode animation.
 * Triggers automatically when text is shown, running smoothly to completion
 * with an ease-out deceleration curve and fixed-position slots.
 */
export function updateAutoDecodeText(mesh, time, shouldShow, duration = 0.45) {
  if (!mesh || !mesh.userData) return;
  if (!mesh.userData.decodeState) {
    mesh.userData.decodeState = {
      triggered: false,
      startTime: 0,
      completed: false,
      lastStep: -1
    };
  }
  const state = mesh.userData.decodeState;

  if (shouldShow) {
    if (!state.triggered) {
      state.triggered = true;
      state.startTime = time;
      state.completed = false;
      state.lastStep = -1;
    }

    if (!state.completed) {
      const elapsed = Math.max(0, time - state.startTime);
      const rawProgress = Math.min(1.0, elapsed / duration);
      // Smooth deceleration curve so the ending snaps with crisp confidence
      const easedProgress = 1.0 - Math.pow(1.0 - rawProgress, 2.2);
      const step = Math.floor(elapsed * 16); // 16fps scramble update
      if (step !== state.lastStep || rawProgress >= 1.0) {
        state.lastStep = step;
        updateTextScramble(mesh, easedProgress, step);
        if (rawProgress >= 1.0) {
          state.completed = true;
          updateTextScramble(mesh, 1.0, 0);
        }
      }
    }
  } else {
    // When scrolled back out of view, reset so it can trigger cleanly next time
    if (state.triggered) {
      state.triggered = false;
      state.completed = false;
      state.lastStep = -1;
      updateTextScramble(mesh, 0.0, 0);
    }
  }
}

/**
 * Creates the monumental incomplete "สำเร็จ" structure for Scene 02.
 * Features broken geometry, wireframe sections, and detached floating pieces.
 */
export function createIncompleteSuccessStructure() {
  const group = new THREE.Group();

  // Main textured plane with "สำเร็จ"
  const mainText = createTextPlane('สำเร็จ', {
    planeWidth: 16,
    planeHeight: 7,
    fontSize: 180,
    color: '#F1EFEA',
    textureWidth: 2048,
    textureHeight: 800
  });
  mainText.material.opacity = 0.85;
  group.add(mainText);

  // Wireframe structural grid framing the word
  const wireGeom = new THREE.BoxGeometry(16.5, 7.5, 0.4, 8, 4, 1);
  const wireMat = new THREE.MeshBasicMaterial({
    color: '#69358A',
    wireframe: true,
    transparent: true,
    opacity: 0.28
  });
  const wireMesh = new THREE.Mesh(wireGeom, wireMat);
  group.add(wireMesh);

  // Detached structural shards floating around the incomplete word
  const shardCount = 14;
  const shardGroup = new THREE.Group();
  const shardGeom = new THREE.PlaneGeometry(0.8, 0.4);
  const shardMat = new THREE.MeshBasicMaterial({
    color: '#B8B8B8',
    wireframe: true,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide
  });

  for (let i = 0; i < shardCount; i++) {
    const shard = new THREE.Mesh(shardGeom, shardMat);
    shard.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 4
    );
    shard.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      0
    );
    shardGroup.add(shard);
  }
  group.add(shardGroup);

  group.userData = {
    mainText,
    wireMesh,
    shardGroup
  };

  return group;
}
