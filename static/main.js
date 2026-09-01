import { init_hero_ecg, init_theme_toggle, start_clock, init_mobile_nav, init_typewriter, init_scroll_reveal, format_post_date, format_relative_time, escape_html, fetch_feed_posts } from './shared.js';
import * as THREE from '/vendor/three/three.module.min.js';
import { OrbitControls } from '/vendor/three/OrbitControls.js';
import { GLTFLoader } from '/vendor/three/GLTFLoader.js';
import { DRACOLoader } from '/vendor/three/DRACOLoader.js';

init_hero_ecg();
init_theme_toggle();
start_clock();
init_mobile_nav();
init_typewriter();
init_scroll_reveal();

function resolve_theme_color(css_variable) {
  const probe = document.createElement('div');
  probe.style.color = getComputedStyle(document.documentElement).getPropertyValue(css_variable).trim();
  document.body.appendChild(probe);
  const resolved_rgb = getComputedStyle(probe).color;
  probe.remove();
  return new THREE.Color().setStyle(resolved_rgb);
}

async function load_readings() {
  const strip_el = document.querySelector('.readings .strip');
  if (!strip_el) return;

  try {
    const posts = await fetch_feed_posts();
    const recent_posts = posts.slice(0, 3);
    strip_el.innerHTML = recent_posts.map(post => `
      <a class="read" href="${post.link}">
        <div class="row-top">
          <span class="date">${format_post_date(post.date)}</span>
          <span class="tag">${post.tags.map(escape_html).join(', ')}</span>
        </div>
        <span class="ttl">${escape_html(post.title)}</span>
        <p class="summary">${escape_html(post.summary)}</p>
      </a>
    `).join('');
  } catch {
    strip_el.innerHTML = '<div class="note">// no readings found.</div>';
  }
}

async function load_guestbook_teaser() {
  const rows_el = document.querySelector('[data-gb-tui-rows]');
  const count_el = document.querySelector('[data-gb-count]');
  const gauge_fill_el = document.querySelector('[data-gb-gauge-fill]');
  if (!rows_el) return;

  try {
    const entries = await fetch('/api/guestbook').then(response => response.json());
    const recent_entries = entries.slice(0, 6);

    count_el.textContent = String(entries.length).padStart(2, '0');
    gauge_fill_el.style.width = `${Math.min(100, (entries.length / 10) * 100)}%`;

    rows_el.innerHTML = recent_entries.length
      ? recent_entries.map((entry, index) => `
          <li class="gb-tui-row">
            <span class="gb-tui-idx">${String(index + 1).padStart(2, '0')}</span>
            <span class="gb-tui-name">${entry.name?.trim() ? escape_html(entry.name.trim()) : 'anonymous'}</span>
            <span class="gb-tui-msg">${escape_html(entry.message)}</span>
          </li>
        `).join('')
      : '<li class="gb-tui-empty">// no entries yet — be the first.</li>';
  } catch {
    count_el.textContent = '—';
    rows_el.innerHTML = '<li class="gb-tui-empty">// couldn\'t load entries.</li>';
  }
}

async function load_notes() {
  const log_el = document.querySelector('.notes .log');
  if (!log_el) return;

  const page_size = 5;
  let page = 0;

  const data_el = document.querySelector('[data-notes-json]');
  let notes = [];
  try {
    notes = data_el ? JSON.parse(data_el.textContent) : [];
  } catch (error) {
    console.error('[notes] parse failed:', error);
    return;
  }

  const count_el = log_el.querySelector('[data-note-count]');
  if (count_el) count_el.textContent = String(notes.length).padStart(3, '0');

  const entries_wrap = document.createElement('div');
  entries_wrap.className = 'log-entries';
  log_el.querySelector('.log-bar').insertAdjacentElement('afterend', entries_wrap);

  const range_el = log_el.querySelector('[data-page-range]');
  const total_el = log_el.querySelector('[data-page-total]');
  const prev_button = log_el.querySelector('[data-log-prev]');
  const next_button = log_el.querySelector('[data-log-next]');
  const total_pages = Math.max(1, Math.ceil(notes.length / page_size));

  const render_entry = note => {
    const tags_html = note.tags?.length
      ? `<div class="tags">${note.tags.map(tag => `<span>${tag}</span>`).join('')}</div>`
      : '';
    const message_html = note.msg;
    return `
      <div class="entry-row">
        <div class="ts" title="${note.ts}">${format_relative_time(note.iso)}</div>
        <div class="lvl" data-lvl="${note.lvl}">${note.lvl}</div>
        <div class="msg">${message_html}${tags_html}</div>
      </div>
    `;
  };

  const render_page = () => {
    const start = page * page_size;
    const page_notes = notes.slice(start, start + page_size);

    entries_wrap.innerHTML = page_notes.map(render_entry).join('');

    range_el.textContent = notes.length ? `${start + 1}–${Math.min(start + page_size, notes.length)}` : '0';
    total_el.textContent = notes.length;
    prev_button.disabled = page === 0;
    next_button.disabled = page >= total_pages - 1;
  };

  prev_button.addEventListener('click', () => { if (page > 0) { page--; render_page(); } });
  next_button.addEventListener('click', () => { if (page < total_pages - 1) { page++; render_page(); } });

  render_page();
}

function init_specimen_viewer(wrapper) {
  const canvas = wrapper.querySelector('canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.6, 4);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const specimen_group = new THREE.Group();
  scene.add(specimen_group);

  const specimen_material = new THREE.LineBasicMaterial({ color: resolve_theme_color('--ink') });
  const edge_threshold_degrees = 15;

  const frame_camera_to_object = loaded_object => {
    const bounding_box = new THREE.Box3().setFromObject(loaded_object);
    const box_center = bounding_box.getCenter(new THREE.Vector3());
    const box_size = bounding_box.getSize(new THREE.Vector3()).length();

    loaded_object.position.sub(box_center);
    camera.position.set(0, box_size * 0.2, box_size * 1.1);
    camera.near = box_size / 100;
    camera.far = box_size * 10;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
  };

  const draco_loader = new DRACOLoader();
  draco_loader.setDecoderPath('/vendor/three/draco/');

  const gltf_loader = new GLTFLoader();
  gltf_loader.setDRACOLoader(draco_loader);

  gltf_loader.load(
    '/assets/exploded-skull.glb',
    gltf => {
      const meshes_to_replace = [];
      gltf.scene.traverse(child => {
        if (child.isMesh) meshes_to_replace.push(child);
      });

      meshes_to_replace.forEach(mesh => {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry, edge_threshold_degrees),
          specimen_material
        );
        edges.position.copy(mesh.position);
        edges.rotation.copy(mesh.rotation);
        edges.scale.copy(mesh.scale);
        mesh.parent.add(edges);
        mesh.parent.remove(mesh);
      });

      specimen_group.add(gltf.scene);
      frame_camera_to_object(specimen_group);
    },
    undefined,
    error => console.error('specimen viewer: failed to load model', error)
  );

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.4;

  const resize_viewer = () => {
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize_viewer();
  new ResizeObserver(resize_viewer).observe(wrapper);

  let animation_frame_id = null;
  const render_loop = () => {
    controls.update();
    renderer.render(scene, camera);
    animation_frame_id = requestAnimationFrame(render_loop);
  };

  const visibility_observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && animation_frame_id === null) {
        render_loop();
      } else if (!entry.isIntersecting && animation_frame_id !== null) {
        cancelAnimationFrame(animation_frame_id);
        animation_frame_id = null;
      }
    });
  }, { threshold: 0.15 });
  visibility_observer.observe(wrapper);

  const theme_observer = new MutationObserver(() => {
    specimen_material.color = resolve_theme_color('--ink');
  });
  theme_observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

document.querySelectorAll('[data-specimen-viewer]').forEach(init_specimen_viewer);

load_readings();
load_guestbook_teaser();
load_notes();
