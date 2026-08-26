import { init_hero_ecg, init_theme_toggle, start_clock, init_mobile_nav, init_typewriter, init_scroll_reveal } from '/shared.js';
import * as THREE from '/vendor/three/three.module.min.js';
import { OrbitControls } from '/vendor/three/OrbitControls.js';
import { GLTFLoader } from '/vendor/three/GLTFLoader.js';

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

  new GLTFLoader().load(
    '/assets/thesis_massager.glb',
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
